
from tornado import web, gen, escape
from notebook.base.handlers import (
    IPythonHandler, json_errors
)

class ContentsHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        self.set_status(200)
        self.finish(self.settings["contents_manager"].root_dir)