"""DSpace Tornado handlers used for testing."""

import requests
import os

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class TestDSpaceHandler(IPythonHandler):

    admin_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "admin.txt")

    blank_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "blank.xml")

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        try:
            with open(TestDSpaceHandler.admin_file, "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening"
                                     "login details file")

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

        URL = self.get_query_argument("ID")

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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def delete(self):
        ID = self.get_query_argument("ID")
        try:
            with open(TestDSpaceHandler.admin_file, "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening"
                                     "login details file")

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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def put(self):
        ID = self.get_query_argument("ID")
        try:
            with open(TestDSpaceHandler.admin_file, "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening"
                                     "login details file")

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

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        IDs = self.get_query_arguments("IDs[]")
        try:
            with open(TestDSpaceHandler.admin_file, "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening"
                                     "login details file")

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
