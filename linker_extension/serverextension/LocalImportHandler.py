"""Handler for importing local data."""

import requests
from requests_futures.sessions import FuturesSession
import os
import re
import shutil
import json
import base64

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig
from urllib.parse import urljoin


class ImportHandler(IPythonHandler):
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        #TODO: surround json with try-catch
        
        result_dict = {};
        arguments = escape.json_decode(self.request.body)
        files = arguments["files"]

        for index, file in enumerate(files):
            base64_data = file["file_contents"].split(",")[1]

            encoding_info = file["file_contents"].split(",")[0]
            encoding_info = encoding_info.split(";")[0]
            encoding_info = encoding_info.split(":")[1]
            filename = file["file_name"]
            with open(filename, "wb") as f:
                f.write(base64.decodestring(base64_data.encode("utf-8")))
            result_dict[filename] = {
                "error": False, 
                "message": "Success!",
                "name": filename,
                "paths": []
            }

        self.finish(result_dict)
