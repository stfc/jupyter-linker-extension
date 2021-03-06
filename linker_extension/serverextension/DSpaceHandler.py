"""DSpace Tornado handlers for the notebook server."""

import json
import requests
import os

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from urllib.parse import urljoin
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig

# -----------------------------------------------------------------------------
# DSpace handler
# -----------------------------------------------------------------------------


class DSpaceHandler(IPythonHandler):

    # this get allows us to get the collections, we use this to populate the
    # repository/department dropdown.
    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        community = self.get_query_argument("community", default="")
        if community:
            url = urljoin(dspace_url, "/rest/communities/" + community + "/collections")
        else:
            url = urljoin(dspace_url, "/rest/communities")

        verify_param = True
        cert = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                  "resources",
                                  "cert.pem")
        try:
            r = requests.request('GET', url, verify=verify_param)
        except requests.exceptions.SSLError:
            verify_param = cert
            r = requests.request('GET', url, verify=verify_param)
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")

        # create a new object so that we can specify the parent community.
        children = json.loads(r.text)
        return_obj = {}
        return_obj["children"] = children
        return_obj["parent"] = community
        self.finish(return_obj)

    # unused? here as an example of how to do submit via dspace api
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        login_file = open(os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                       "resources",
                                       "admin.txt"),
                          "r")

        un = login_file.readline().strip()
        pw = login_file.readline().strip()
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
            r = requests.request('POST',
                                 url,
                                 headers=headers,
                                 data=binary_zip_file,
                                 verify=cert,
                                 auth=(un, pw))
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")
        
        token = login.text
        metadata = []

        repository = self.get_query_argument('repository')

        title = self.get_query_argument('title', default=None)
        if title is not None:  # should never happen but just in case
            metadata.append({"key": "dc.title", "value": title})

        authors = self.get_query_arguments('authors[]')
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    metadata.append({"key": "dc.contributor.author",
                                     "value": author})

        abstract = self.get_query_argument('abstract', default=None)
        if abstract is not None:  # shouldn't happen
            metadata.append({"key": "dc.description.abstract",
                             "value": abstract})

        tags = self.get_query_arguments('tags[]')
        if tags is not []:
            if len(tags) > 0:
                for tag in tags:
                    metadata.append({"key": "dc.subject.other", "value": tag})

        date = self.get_query_argument('date', default=None)
        if date is not None:  # shouldn't happen
            # date string is already in the format we need
            metadata.append({"key": "dc.date.issued", "value": date})

        language = self.get_query_argument('language')
        if language is not None:
            metadata.append({"key": "dc.language.iso", "value": language})

        publisher = self.get_query_argument('publisher', default=None)
        if publisher is not None:
            metadata.append({"key": "dc.publisher", "value": publisher})

        citation = self.get_query_argument('citation', default=None)
        if citation is not None:
            metadata.append({"key": "dc.identifier.citation",
                             "value": citation})

        referencedBy = self.get_query_argument('referencedBy', default=None)
        if referencedBy is not None:
            metadata.append({"key": "dc.relation.isreferencedby",
                             "value": referencedBy})

        funders = self.get_query_argument('funders', default=None)
        if funders is not None:
            metadata.append({"key": "dc.contributor.funder", "value": funders})

        sponsors = self.get_query_argument('sponsors', default=None)
        if funders is not None:
            metadata.append({"key": "dc.description.sponsorship",
                             "value": sponsors})

        url = urljoin(dspace_url, "/rest/collections/" + repository + "/items")
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json',
                   'rest-dspace-token': token}
        new_item = requests.request('POST',
                                    url,
                                    headers=headers,
                                    json={"type": "item", "metadata": metadata},
                                    verify=verify_param)

        reponse = json.loads(new_item.text)
        new_item_id = reponse["id"]
        notebook_path = self.get_query_argument("notebookpath")
        notebook_split = notebook_path.split('/')
        notebook_name = notebook_split[-1]
        notebook_dir = os.getcwd()
        full_path = notebook_dir + "/" + notebook_path
        file = open(full_path, "rb")
        binary_data = file.read()

        url = urljoin(dspace_url, "/rest/items/" + str(new_item_id) + "/bitstreams")
        headers = {'Content-Type': 'multipart/form-data',
                   'Accept': 'application/json',
                   'rest-dspace-token': token}
        add_notebook = requests.request('POST',
                                        url,
                                        headers=headers,
                                        data=binary_data,
                                        verify=verify_param)

        reponse_notebook = json.loads(add_notebook.text)
        add_notebook_id = reponse_notebook["id"]

        url = urljoin(dspace_url, "/rest/bitstreams/" + str(add_notebook_id))
        headers = {'Content-Type': 'application/json',
                   'Accept': 'application/json',
                   'rest-dspace-token': token}
        json = {"name": notebook_name,
                "description": "Notebook",
                "mimeType": "application/octet-stream"}
        add_notebook_metadata = requests.request('PUT',
                                                 url,
                                                 headers=headers,
                                                 json=json,
                                                 verify=verify_param)
        self.finish()
