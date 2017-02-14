"""DSpace Tornado handlers used for testing."""

import requests
import os

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig
from urllib.parse import urljoin


class FindIDViaMetadata(IPythonHandler):

    # given an item url, return an dspace item. done via searching DSpace on the
    # field dc.identifier
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']

        url = urljoin(dspace_url, "/rest/login")
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json'}

        login = requests.request('POST',
                                 url,
                                 headers=headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        URL = arguments["ID"]

        url = urljoin(dspace_url, "/rest/items/find-by-metadata-field")
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json',
                   'rest-dspace-token': token}

        get_item_by_url = requests.request('POST',
                                           url,
                                           headers=headers,
                                           json={"key": "dc.identifier.uri",
                                                 "value": URL},
                                           verify=False)
        self.finish(get_item_by_url.json()[0])


class DeleteItem(IPythonHandler):

    # given an item id, delete the item with that id
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        ID = arguments["ID"]

        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        login = requests.request('POST',
                                 login_url,
                                 headers=login_headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}
        url = urljoin(dspace_url, "/rest/items/" + ID)

        delete_item = requests.request('DELETE',
                                       url,
                                       headers=headers,
                                       verify=False)

        get_deleted_item = requests.request('GET',
                                            url,
                                            headers=headers,
                                            verify=False)

        unicode_status = str(get_deleted_item.status_code)
        self.finish(unicode_status)


class GetBitstreams(IPythonHandler):

    # given an id, return the bitstreams associated with that item
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        ID = arguments["ID"]

        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        login = requests.request('POST',
                                 login_url,
                                 headers=login_headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        url = urljoin(dspace_url, "rest/items/" + ID + "/bitstreams")
        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}

        get_bitstreams = requests.request('GET',
                                          url,
                                          headers=headers,
                                          verify=False)
        output_dict = {}
        for index, value in enumerate(get_bitstreams.json()):
            output_dict[str(index)] = value
        self.finish(output_dict)


class GetBitstreamData(IPythonHandler):

    # given the IDs of multiple bitstreams, return the data inside those
    # bitstreams
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        IDs = arguments["IDs"]

        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        login = requests.request('POST',
                                 login_url,
                                 headers=login_headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        result_dict = {}
        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}

        for index, ID in enumerate(IDs):
            url = urljoin(dspace_url, "/rest/bitstreams/" + ID + "/retrieve")

            get_bitstream_data = requests.request('GET',
                                                  url,
                                                  headers=headers,
                                                  verify=False)
            result_dict[str(index)] = get_bitstream_data.text

        self.finish(result_dict)
