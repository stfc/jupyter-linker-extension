"""DSpace Tornado handlers for the notebook server."""

import json
import requests
import os

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)

# -----------------------------------------------------------------------------
# DSpace handler
# -----------------------------------------------------------------------------


class DSpaceHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        login_file = open("/srv/jupyterhub/admin.txt", "r")
        un = login_file.readline().strip()
        pw = login_file.readline().strip()
        login = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/login', headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={"email": un, "password": pw}, verify=False)
        token = login.text  # TODO: link up jupyterhub login details to provide DSpace with the login details as well
        metadata = []

        repository = self.get_query_argument('repository')

        title = self.get_query_argument('title', default=None)
        if title is not None:  # should never happen but just in case
            metadata.append({"key": "dc.title", "value": title})

        authors = self.get_query_arguments('authors[]')
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    metadata.append({"key": "dc.contributor.author", "value": author})

        abstract = self.get_query_argument('abstract', default=None)
        if abstract is not None:  # shouldn't happen
            metadata.append({"key": "dc.description.abstract", "value": abstract})

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
            metadata.append({"key": "dc.identifier.citation", "value": citation})

        referencedBy = self.get_query_argument('referencedBy', default=None)
        if referencedBy is not None:
            metadata.append({"key": "dc.relation.isreferencedby", "value": referencedBy})

        funders = self.get_query_argument('funders', default=None)
        if funders is not None:
            metadata.append({"key": "dc.contributor.funder", "value": funders})

        sponsors = self.get_query_argument('sponsors', default=None)
        if funders is not None:
            metadata.append({"key": "dc.description.sponsorship", "value": sponsors})

        new_item = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/collections/' + repository + '/items', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'rest-dspace-token': token}, json={"type": "item", "metadata": metadata}, verify=False)

        reponse = json.loads(new_item.text)
        new_item_id = reponse["id"]
        notebook_path = self.get_query_argument("notebookpath")
        notebook_split = notebook_path.split('/')
        notebook_name = notebook_split[-1]
        notebook_dir = os.getcwd()
        full_path = notebook_dir + "/" + notebook_path
        file = open(full_path, "rb")
        binary_data = file.read()

        #charizard_file = open("/home/mnf98541/mega_charizard.png", "rb")
        #charizard_data = charizard_file.read()

        add_notebook = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/items/' + str(new_item_id) + '/bitstreams', headers={'Content-Type': 'multipart/form-data', 'Accept': 'application/json', 'rest-dspace-token': token}, data=binary_data, verify=False)
        #add_charizard = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/rest/items/' + str(new_item_id) + '/bitstreams', headers={'Content-Type': 'multipart/form-data', 'Accept': 'application/json', 'rest-dspace-token': token}, data=charizard_data, verify=False)

        reponse_notebook = json.loads(add_notebook.text)
        add_notebook_id = reponse_notebook["id"]

        #reponse_charizard = json.loads(add_charizard.text)
        #add_charizard_id = reponse_charizard["id"]

        add_notebook_metadata = requests.request('PUT', 'https://epublicns05.esc.rl.ac.uk/rest/bitstreams/' + str(add_notebook_id), headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'rest-dspace-token': token}, json={"name": notebook_name, "description": "Notebook", "mimeType": "application/octet-stream"}, verify=False)
        #add_charizard_metadata = requests.request('PUT', 'https://epublicns05.esc.rl.ac.uk/rest/bitstreams/' + str(add_charizard_id), headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'rest-dspace-token': token}, json={"name": "Mega Charizard Y", "description": "Mega Charizard Y: the best Pokémon", "format": "image/png", "mimeType": "image/png"}, verify=False)
        self.finish()