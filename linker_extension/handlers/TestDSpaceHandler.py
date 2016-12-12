"""DSpace Tornado handlers used for testing."""

import requests

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class TestDSpaceHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        try:
            with open("/srv/jupyterhub/admin.txt", "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        login = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/login', headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={"email": un, "password": pw}, verify=False)
        print(login.status_code)
        token = login.text

        URL = self.get_query_argument("ID")

        get_item_by_url = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/items/find-by-metadata-field', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'rest-dspace-token': token}, json={"key": "dc.identifier.uri", "value": URL}, verify=False)
        self.finish(get_item_by_url.json()[0])

    @web.authenticated
    @json_errors
    @gen.coroutine
    def delete(self):
        ID = self.get_query_argument("ID")
        try:
            with open("/srv/jupyterhub/admin.txt", "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        login = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/login', headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={"email": un, "password": pw}, verify=False)
        token = login.text

        delete_item = requests.request('DELETE', 'https://epublicns05.esc.rl.ac.uk/rest/items/' + ID, headers={'Content-Type': 'application/json', 'rest-dspace-token': token}, verify=False)

        get_deleted_item = requests.request('GET', 'https://epublicns05.esc.rl.ac.uk/rest/items/' + ID, headers={'Content-Type': 'application/json', 'rest-dspace-token': token}, verify=False)

        unicode_status = str(get_deleted_item.status_code)
        self.finish(unicode_status)

    @web.authenticated
    @json_errors
    @gen.coroutine
    def put(self):
        ID = self.get_query_argument("ID")
        try:
            with open("/srv/jupyterhub/admin.txt", "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        login = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/login', headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={"email": un, "password": pw}, verify=False)
        token = login.text

        get_bitstreams = requests.request('GET', 'https://epublicns05.esc.rl.ac.uk/rest/items/' + ID + "/bitstreams", headers={'Content-Type': 'application/json', 'rest-dspace-token': token}, verify=False)
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
            with open("/srv/jupyterhub/admin.txt", "r") as f:
                un = f.readline().strip()
                pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        login = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/login', headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={"email": un, "password": pw}, verify=False)
        token = login.text

        result_dict = {}

        for index, ID in enumerate(IDs):
            get_bitstream_data = requests.request('GET', 'https://epublicns05.esc.rl.ac.uk/rest/bitstreams/' + ID + "/retrieve", headers={'Content-Type': 'application/json', 'rest-dspace-token': token}, verify=False)
            result_dict[str(index)] = get_bitstream_data.text

        #get_bitstream_data = requests.request('GET', 'https://epublicns05.esc.rl.ac.uk/rest/bitstreams/' + ID + "/retrieve", headers={'Content-Type': 'application/json', 'rest-dspace-token': token}, verify=False)
        self.finish(result_dict)