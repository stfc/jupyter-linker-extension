"""DSpace Tornado handlers used for testing."""

import requests
import os

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class FindIDViaMetadata(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        print(self.request)
        print(self.request.body)
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']

        url = 'https://epublicns05.esc.rl.ac.uk/rest/login'
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json'}

        login = requests.request('POST',
                                 url,
                                 headers=headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        print(login.status_code)
        token = login.text

        URL = arguments["ID"]

        url = 'https://epublicns05.esc.rl.ac.uk/rest/items/find-by-metadata-field'
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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        ID = arguments["ID"]

        login_url = 'https://epublicns05.esc.rl.ac.uk/rest/login'
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
        url = 'https://epublicns05.esc.rl.ac.uk/rest/items/' + ID

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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        ID = arguments["ID"]

        login_url = 'https://epublicns05.esc.rl.ac.uk/rest/login'
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        login = requests.request('POST',
                                 login_url,
                                 headers=login_headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        url = "https://epublicns05.esc.rl.ac.uk/rest/items/" + ID + "/bitstreams"
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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        IDs = arguments["IDs"]

        login_url = 'https://epublicns05.esc.rl.ac.uk/rest/login'
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
            url = ("https://epublicns05.esc.rl.ac.uk/rest/bitstreams/" + ID +
                   "/retrieve")

            get_bitstream_data = requests.request('GET',
                                                  url,
                                                  headers=headers,
                                                  verify=False)
            result_dict[str(index)] = get_bitstream_data.text

        self.finish(result_dict)
