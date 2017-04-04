"""DSpace Tornado handlers used for testing."""

import requests
import os
import json

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig
from urllib.parse import urljoin

class ListAllItems(IPythonHandler):

    # return all dspace items
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']

        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")

        token = login.text

        url = urljoin(dspace_url, "/rest/items")
        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}

        get_all_items = requests.request('GET',
                                           url,
                                           headers=headers,
                                           verify=verify_param)
        self.finish(json.dumps(get_all_items.json()))

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

        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")
        
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
                                           verify=verify_param)
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

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")
        
        token = login.text

        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}
        url = urljoin(dspace_url, "/rest/items/" + ID)

        delete_item = requests.request('DELETE',
                                       url,
                                       headers=headers,
                                       verify=verify_param)

        get_deleted_item = requests.request('GET',
                                            url,
                                            headers=headers,
                                            verify=verify_param)

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

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")
        
        token = login.text

        url = urljoin(dspace_url, "rest/items/" + ID + "/bitstreams")
        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}

        get_bitstreams = requests.request('GET',
                                          url,
                                          headers=headers,
                                          verify=verify_param)
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

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            login = requests.request('POST',
                                     login_url,
                                     headers=login_headers,
                                     json={"email": un, "password": pw},
                                     verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")
        
        token = login.text

        result_dict = {}
        headers = {'Content-Type': 'application/json',
                   'rest-dspace-token': token}

        for index, ID in enumerate(IDs):
            url = urljoin(dspace_url, "/rest/bitstreams/" + ID + "/retrieve")

            get_bitstream_data = requests.request('GET',
                                                  url,
                                                  headers=headers,
                                                  verify=verify_param)
            result_dict[str(index)] = get_bitstream_data.text

        self.finish(result_dict)
