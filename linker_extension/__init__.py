"""DSpace Tornado handlers for the notebook server."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile
import ldap3
import re

from tornado import web, gen, escape

from notebook.utils import url_path_join
from notebook.base.handlers import (
    IPythonHandler, APIHandler, json_errors, path_regex,
)

from notebook.nbconvert.handlers import (
    get_exporter, respond_zip, find_resource_files,
)

from ipython_genutils import text

#-----------------------------------------------------------------------------
# DSpace handler
#-----------------------------------------------------------------------------


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


class SWORDHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        path = self.request.path  # should be of the form "/user/{username}/sword"
        if(len(path.split("/")) == 4):
            username = path.split("/")[2]
        elif(len(path.split("/")) == 2):  # TODO: remove later - this is for testing the notebook only (no Hub)
            username = ""
        elif(len(path.split("/")) == 3):  # this is for the js test - find a better way to do this?
            username = ""
        else:
            raise web.HTTPError(500, "path string is not correct length")

        print("getting service document")
        try:
            if (username):
                with open("/srv/jupyterhub/admin.txt", "r") as f:
                    print("using admin.txt")
                    un = f.readline().strip()
                    pw = f.readline().strip()
            else:
                with open("/home/mnf98541/notebook/login.txt", "r") as f:  # TODO: remove later - this is for testing the notebook only (no Hub)
                    un = f.readline().strip()
                    pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        r = requests.request('GET', 'https://epublicns05.esc.rl.ac.uk/sword/servicedocument', verify=False, auth=(un, pw))
        self.finish(r.text)


    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        path = self.request.path  # should be of the form "/user/{username}/sword"
        if(len(path.split("/")) == 4):
            username = path.split("/")[2]
        elif(len(path.split("/")) == 2):  # TODO: remove later - this is for testing the notebook only (no Hub)
            username = ""
        elif(len(path.split("/")) == 3):  # this is for the js test - find a better way to do this?
            username = ""
        else:
            raise web.HTTPError(500, "path string is not correct length")

        repository = self.get_query_argument('repository')
        try:
            if (username):
                with open("/srv/jupyterhub/admin.txt", "r") as f:
                    un = f.readline().strip()
                    pw = f.readline().strip()
            else:
                with open("/home/mnf98541/notebook/login.txt", "r") as f:  # TODO: remove later - this is for testing the notebook only (no Hub)
                    un = f.readline().strip()
                    pw = f.readline().strip()
                    username = un
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")
        
        ET.register_namespace("", "http://www.loc.gov/METS/")
        ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
        ET.register_namespace("dc", "http://purl.org/dc/elements/1.1/")
        ET.register_namespace("dcterms", "http://purl.org/dc/terms/")

        try:
            tree = ET.ElementTree(file="/srv/jupyterhub/blank.xml")
        except ET.ParseError:
            raise web.HTTPError(500, "IndexError occured when fetching metadata node")

        root = tree.getroot()
        root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")
        root.set("xmlns:dc", "http://purl.org/dc/elements/1.1/")
        root.set("xmlns:dcterms", "http://purl.org/dc/terms/")

        try:
            metadata = tree.getroot()[1][0][0]
        except IndexError:
            raise web.HTTPError(500, "IndexError occured when fetching metadata node")

        title = self.get_query_argument('title', default=None)
        if title is not None:  # should never happen but just in case TODO: publishing needs to check that required fields are filled before sending (i.e that they're not sending empty metadata)
            title_xml = ET.Element("dc:title")
            title_xml.text = title
            metadata.append(title_xml)

        authors = self.get_query_arguments('authors[]')
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    author_xml = ET.Element("dc:creator")
                    author_xml.text = author
                    metadata.append(author_xml)

        abstract = self.get_query_argument('abstract', default=None)
        if abstract is not None:  # shouldn't happen
            abstract_xml = ET.Element("dcterms:abstract")
            abstract_xml.text = abstract
            metadata.append(abstract_xml)

        tags = self.get_query_arguments('tags[]')
        if tags is not []:
            if len(tags) > 0:
                for tag in tags:
                    tag_xml = ET.Element("dc:subject")
                    tag_xml.text = tag
                    metadata.append(tag_xml)

        date = self.get_query_argument('date', default=None)
        if date is not None:  # shouldn't happen
            # date string is already in the format we need
            date_xml = ET.Element("dcterms:issued")
            date_xml.text = date
            metadata.append(date_xml)

        language = self.get_query_argument('language')
        if language is not None:
            language_xml = ET.Element("dc:language")
            language_xml.text = language
            metadata.append(language_xml)

        publisher = self.get_query_argument('publisher', default=None)
        if publisher is not None:
            publisher_xml = ET.Element("dc:publisher")
            publisher_xml.text = publisher
            metadata.append(publisher_xml)

        citation = self.get_query_argument('citation', default=None)
        if citation is not None:
            citation_xml = ET.Element("dcterms:bibliographicCitation")
            citation_xml.text = citation
            metadata.append(citation_xml)

        referencedBys = self.get_query_arguments('referencedBy[]')
        if referencedBys is not []:
            if len(referencedBys) > 0:
                for referencedBy in referencedBys:
                    reference_xml = ET.Element("dcterms:isReferencedBy")
                    reference_xml.text = referencedBy
                    metadata.append(reference_xml)

        #funders = self.get_query_argument('funders', default=None)
        #if funders is not None:
        #    metadata.append({"key": "dc.contributor.funder", "value": funders})

        #sponsors = self.get_query_argument('sponsors', default=None)
        #if funders is not None:
        #    metadata.append({"key": "dc.description.sponsorship", "value": sponsors})

        try:
            notebook_path = self.get_query_argument("notebookpath")
            notebook_split = notebook_path.split('/')
            notebook_name = notebook_split[-1]
            notebook_dir = os.getcwd()
            full_path = notebook_dir + "/" + notebook_path
        except web.MissingArgumentError:
            raise web.HTTPError(500, "MissingArgumentError occured - notebook path isn't specified")
        except IndexError:
            raise web.HTTPError(500, "IndexError when parsing notebook_path")

        try:
            files = tree.getroot()[2][0]
            files_xml = ET.Element('file', {"GROUPID": "sword-mets-fgid-0", "ID": "sword-mets-file-1", "MIMETYPE":"application/octet-stream"})
            FLocat_xml = ET.Element('FLocat', {"LOCTYPE": "URL", "xlink:href": notebook_name})
            files_xml.append(FLocat_xml)
            files.append(files_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting 'files' root node")

        try:
            struct = tree.getroot()[3]
            struct_xml = ET.Element('div', {"ID": "sword-mets-div-1", "DMDID": "sword-mets-dmd-1", "TYPE": "SWORD Object"})
            struct_xml_child = ET.Element('div', {"ID": "sword-mets-div-2", "TYPE": "File"})
            fptr_xml = ET.Element("ftpr", {"FILEID": "sword-mets-file-1"})
            struct_xml_child.append(fptr_xml)
            struct_xml.append(struct_xml_child)
            struct.append(struct_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting 'struct' root node")

        try:
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)  # this is writing to the cwd - might need to change?
        except IOError:
            raise web.HTTPError(500, "IOError when writing tree to mets.xml")

        #with open('mets.xml', 'r') as original:
        #    data = original.read()
        #with open('mets.xml', 'w') as modified:
        #    modified.write('<?xml version="1.0" encoding="utf-8" standalone="no"?>\n' + data)

        try:
            created_zip_file = zipfile.ZipFile("notebook.zip", "w")
            created_zip_file.write("mets.xml")
            created_zip_file.write(notebook_path, notebook_name)
        except:  # dunno what exceptions we might encounter here
            raise web.HTTPError(500, "Error when writing zip file")
        finally:
            created_zip_file.close()
        try:
            with open("notebook.zip", "rb") as f:
                binary_zip_file = f.read()
        except IOError:
            raise web.HTTPError(500, "IOError when reading zip file as binary data")

        notebook_name_no_extension = notebook_name.split(".")[0]
        try:
            r = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/sword/deposit/edata/' + repository, headers={"Content-Disposition": "filename=" + notebook_name_no_extension + ".zip", "Content-Type": "application/zip", "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP", "X-On-Behalf-Of": username}, data=binary_zip_file, verify=False, auth=(un, pw))
            # TODO: add authenication to the request
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")

        print(r.status_code)  # TODO: remove later
        retries = 5

        while (r.status_code != 201 and r.status_code != 202 and retries >= 0):  # SWORD sometimes randomly fails to send a request so retry a couple of times
            try:
                r = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/sword/deposit/edata/' + repository, headers={"Content-Disposition": "filename=" + notebook_name_no_extension + ".zip", "Content-Type": "application/zip", "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP", "X-On-Behalf-Of": username}, data=binary_zip_file, verify=False, auth=(un, pw))
            except requests.exceptions.RequestException:
                raise web.HTTPError(500, "Requests made an error")

            print(r.status_code)
            retries -= 1

        if(r.status_code == 201):
            self.clear()
            self.set_status(201)
            self.finish(r.text)
        elif (r.status_code == 202):
            self.clear()
            self.set_status(202)
            self.finish(r.text)
        else:  # Still failed even after the retries
            raise web.HTTPError(500, "Requests failed after 5 retries")


class helper:
    @staticmethod
    def dir_search(path, file_type, parent_node, id_count):
        path_arr = path.split("/")
        curr_node = parent_node
        end_id_count = id_count
        for index, item in enumerate(path_arr, start=0):
            # Need to check if directory already exists
            existing_div = None
            for div in curr_node.findall('div'):
                if(div.get("ID") == "/".join(path_arr[:(index+1)])):
                    existing_div = div

            if existing_div is not None:  # We only create a new div if there is no existing directory div, otherwise we use the old one
                curr_node = existing_div
            else:
                if(file_type == 'file'):
                    struct_xml_child = ET.Element('div', {"ID": path, "TYPE": "File"})
                    fptr_xml = ET.Element("ftpr", {"FILEID": path})
                    struct_xml_child.append(fptr_xml)
                    curr_node.append(struct_xml_child)
                    end_id_count += 1

                else:
                    struct_xml_child = ET.Element('div', {"ID": "/".join(path_arr[:(index+1)]), "TYPE": "Directory"})
                    curr_node.append(struct_xml_child)
                    curr_node = struct_xml_child
                    end_id_count += 1
        return end_id_count


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


class UploadBundleHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        path = self.request.path  # should be of the form "/user/{username}/uploadbundle"
        if(len(path.split("/")) == 4):
            username = path.split("/")[2]
        elif(len(path.split("/")) == 2):  # TODO: remove later - this is for testing the notebook only (no Hub)
            username = ""
        elif(len(path.split("/")) == 3):  # this is for the js test - find a better way to do this?
            username = ""
        else:
            raise web.HTTPError(500, "path string is not correct length")

        repository = self.get_query_argument('repository')
        try:
            if (username):
                with open("/srv/jupyterhub/admin.txt", "r") as f:
                    un = f.readline().strip()
                    pw = f.readline().strip()
            else:
                with open("/home/mnf98541/notebook/login.txt", "r") as f:  # TODO: remove later - this is for testing the notebook only (no Hub)
                    un = f.readline().strip()
                    pw = f.readline().strip()
                    username = un
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening login details file")

        ET.register_namespace("", "http://www.loc.gov/METS/")
        ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
        ET.register_namespace("dc", "http://purl.org/dc/elements/1.1/")
        ET.register_namespace("dcterms", "http://purl.org/dc/terms/")

        try:
            tree = ET.ElementTree(file="/srv/jupyterhub/blank.xml")
        except ET.ParseError:
            raise web.HTTPError(500, "IndexError occured when fetching metadata node")

        root = tree.getroot()
        root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")
        root.set("xmlns:dc", "http://purl.org/dc/elements/1.1/")
        root.set("xmlns:dcterms", "http://purl.org/dc/terms/")

        try:
            metadata = tree.getroot()[1][0][0]
        except IndexError:
            raise web.HTTPError(500, "IndexError occured when fetching metadata node")

        title = self.get_query_argument('title', default=None)
        if title is not None:  # should never happen but just in case TODO: publishing needs to check that required fields are filled before sending (i.e that they're not sending empty metadata)
            title_xml = ET.Element("dc:title")
            title_xml.text = title
            metadata.append(title_xml)

        authors = self.get_query_arguments('authors[]')
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    author_xml = ET.Element("dc:creator")
                    author_xml.text = author
                    metadata.append(author_xml)

        abstract = self.get_query_argument('abstract', default=None)
        if abstract is not None:  # shouldn't happen
            abstract_xml = ET.Element("dcterms:abstract")
            abstract_xml.text = abstract
            metadata.append(abstract_xml)

        tags = self.get_query_arguments('tags[]')
        if tags is not []:
            if len(tags) > 0:
                for tag in tags:
                    tag_xml = ET.Element("dc:subject")
                    tag_xml.text = tag
                    metadata.append(tag_xml)

        date = self.get_query_argument('date', default=None)
        if date is not None:  # shouldn't happen
            # date string is already in the format we need
            date_xml = ET.Element("dcterms:issued")
            date_xml.text = date
            metadata.append(date_xml)

        language = self.get_query_argument('language')
        if language is not None:
            language_xml = ET.Element("dc:language")
            language_xml.text = language
            metadata.append(language_xml)

        publisher = self.get_query_argument('publisher', default=None)
        if publisher is not None:
            publisher_xml = ET.Element("dc:publisher")
            publisher_xml.text = publisher
            metadata.append(publisher_xml)

        citation = self.get_query_argument('citation', default=None)
        if citation is not None:
            citation_xml = ET.Element("dcterms:bibliographicCitation")
            citation_xml.text = citation
            metadata.append(citation_xml)

        referencedBys = self.get_query_arguments('referencedBy[]')
        if referencedBys is not []:
            if len(referencedBys) > 0:
                for referencedBy in referencedBys:
                    reference_xml = ET.Element("dcterms:isReferencedBy")
                    reference_xml.text = referencedBy
                    metadata.append(reference_xml)


        #funders = self.get_query_argument('funders', default=None)
        #if funders is not None:
        #    metadata.append({"key": "dc.contributor.funder", "value": funders})

        #sponsors = self.get_query_argument('sponsors', default=None)
        #if funders is not None:
        #    metadata.append({"key": "dc.description.sponsorship", "value": sponsors})

        try:
            notebook_path = self.get_query_argument("notebookpath")
            notebook_split = notebook_path.split('/')
            notebook_name = notebook_split[-1]
            notebook_dir = os.getcwd()
            full_path = notebook_dir + "/" + notebook_path
        except web.MissingArgumentError:
            raise web.HTTPError(500, "MissingArgumentError occured - notebook path isn't specified")
        except IndexError:
            raise web.HTTPError(500, "IndexError when parsing notebook_path")

        file_names = self.get_query_arguments('file_names[]')
        file_paths = self.get_query_arguments('file_paths[]')
        file_types = self.get_query_arguments('file_types[]')
        try:
            files = tree.getroot()[2][0]
            id_count = 0
            if file_paths is not []:
                if len(file_names) > 0:
                    for index, file_path in enumerate(file_paths):
                        if(file_types[index] == 'file'):
                            files_xml = ET.Element('file', {"GROUPID": "sword-mets-fgid-" + str(id_count), "ID": file_path, "MIMETYPE":"application/octet-stream"})
                            FLocat_xml = ET.Element('FLocat', {"LOCTYPE": "URL", "xlink:href": file_path})
                            files_xml.append(FLocat_xml)
                            files.append(files_xml)
                            id_count += 1
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting 'files' root node")

        try:
            struct = tree.getroot()[3]
            id_count = 1

            struct_xml = ET.Element('div', {"ID": "sword-mets-div-1", "DMDID": "sword-mets-dmd-1", "TYPE": "SWORD Object"})
            if file_paths is not []:
                if len(file_names) > 0:
                    for index, file_path in enumerate(file_paths):
                        file_type = file_types[index]
                        end_id_count = helper.dir_search(file_path, file_type, struct_xml, id_count)
                        id_count = end_id_count
            struct.append(struct_xml)

        except IndexError:
            raise web.HTTPError(500, "IndexError when getting 'struct' root node")

        try:
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)  # this is writing to the cwd - might need to change?
        except IOError:
            raise web.HTTPError(500, "IOError when writing tree to mets.xml")

        try:
            created_zip_file = zipfile.ZipFile("data_bundle.zip", "w")
            created_zip_file.write("mets.xml")
            if file_paths is not []:
                if len(file_paths) > 0:
                    for file_path in file_paths:
                        created_zip_file.write(file_path)

        except:  # dunno what exceptions we might encounter here
            raise web.HTTPError(500, "Error when writing zip file")
        finally:
            created_zip_file.close()

        try:
            with open("data_bundle.zip", "rb") as f:
                binary_zip_file = f.read()
        except IOError:
            raise web.HTTPError(500, "IOError when reading zip file as binary data")

        notebook_name_no_extension = notebook_name.split(".")[0]
        try:
            r = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/sword/deposit/edata/' + repository, headers={"Content-Disposition": "filename=" + notebook_name_no_extension + " Data.zip", "Content-Type": "application/zip", "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP", "X-On-Behalf-Of": username}, data=binary_zip_file, verify=False, auth=(un, pw))
            # TODO: add authenication to the request"
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")

        print(r.status_code)  # TODO: remove later
        retries = 5

        while (r.status_code != 201 and r.status_code != 202 and retries >= 0):  # SWORD sometimes randomly fails to send a request so retry a couple of times
            try:
                r = requests.request('POST', 'https://epublicns05.esc.rl.ac.uk/sword/deposit/edata/' + repository, headers={"Content-Disposition": "filename=" + notebook_name_no_extension + " Data.zip", "Content-Type": "application/zip", "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP", "X-On-Behalf-Of": username}, data=binary_zip_file, verify=False, auth=(un, pw))
            except requests.exceptions.RequestException:
                raise web.HTTPError(500, "Requests made an error")

            print(r.status_code)
            retries -= 1

        if(r.status_code == 201):  # created
            self.clear()
            self.set_status(201)
            self.finish(r.text)
        elif (r.status_code == 202):  # accepted (waiting for approval)
            self.clear()
            self.set_status(202)
            self.finish(r.text)
        else:  # Still failed even after the retries
            raise web.HTTPError(500, "Requests failed after 5 retries")


# ----------------------------------------------------------------------------
# LDAP handler
# ----------------------------------------------------------------------------


class LDAPHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        firstname = self.get_query_argument('firstname', default="")
        lastname = self.get_query_argument('lastname', default="")

        server = ldap3.Server('logon10.fed.cclrc.ac.uk', get_info=ldap3.ALL)

        conn = ldap3.Connection(server, auto_bind=True)

        result = []

        if firstname and not lastname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk', '(givenName=*' + firstname + '*)', attributes=['sn', 'givenName'])
            result = conn.entries

        if lastname and not firstname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk', '(sn=*' + lastname + '*)', attributes=['sn', 'givenName'])
            result = conn.entries

        if lastname and firstname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk', '(&(sn=*' + lastname + '*)(givenName=*' + firstname + '*))', attributes=['sn', 'givenName'])
            result = conn.entries

        json_entries = []
        for entry in conn.entries:
            json_entries.append(entry.entry_to_json())

        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps(json_entries))

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        json_obj = escape.json_decode(self.request.body)

        username = json_obj['username']
        password = json_obj['password']

        valid_username_regex = r'^[a-z][.a-z0-9_-]*$'

        bind_dn_template = [
            'cn={username},ou=fbu,dc=fed,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=tbu,dc=fed,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=Swindon,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=obu,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=RALSpace,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=ROE,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=PPD,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=DLS,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=Facility Users,ou=fbu,dc=cclrc,dc=ac,dc=uk',
            'cn={username},ou=RCaH,dc=cclrc,dc=ac,dc=uk'
        ]

        if not re.match(valid_username_regex, username):
            self.set_status(400)
            self.finish()
            return None

        def getConnection(userdn, username, password):
            server = ldap3.Server('logon10.fed.cclrc.ac.uk', get_info=ldap3.ALL)

            conn = ldap3.Connection(server, user=userdn, password=password)
            return conn

        for dn in bind_dn_template:
            userdn = dn.format(username=username)
            conn = getConnection(userdn, username, password)
            isBound = conn.bind()
            if isBound:
                break

        if isBound:
            self.set_status(200)
            self.finish()
        else:
            print("didn't log in")
            self.set_status(401)
            self.finish()

# ----------------------------------------------------------------------------
# Custom Nbconvert handler (need this to select template)
# ----------------------------------------------------------------------------


class CustomNbconvertHandler(IPythonHandler):

    SUPPORTED_METHODS = ('GET',)

    @web.authenticated
    def get(self, format, template_file, path):

        exporter = get_exporter(format, config=self.config, log=self.log, template_file=template_file)

        path = path.strip('/')
        model = self.contents_manager.get(path=path)
        name = model['name']
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)

        self.set_header('Last-Modified', model['last_modified'])

        try:
            output, resources = exporter.from_notebook_node(
                model['content'],
                resources={
                    "metadata": {
                        "name": name[:name.rfind('.')],
                        "modified_date": (model['last_modified']
                            .strftime(text.date_format))
                    },
                    "config_dir": self.application.settings['config_dir'],
                }
            )
        except Exception as e:
            self.log.exception("nbconvert failed: %s", e)
            raise web.HTTPError(500, "nbconvert failed: %s" % e)

        if respond_zip(self, name, output, resources):
            return

        # Force download if requested
        if self.get_argument('download', 'false').lower() == 'true':
            filename = os.path.splitext(name)[0] + resources['output_extension']
            self.set_header('Content-Disposition',
                            'attachment; filename="%s"' % escape.url_escape(filename))

        # MIME type
        if exporter.output_mimetype:
            self.set_header('Content-Type',
                            '%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)

# ----------------------------------------------------------------------------
# URL to handler mappings
# ----------------------------------------------------------------------------

_format_regex = r"(?P<format>\w+)"

_template_regex = r"(?P<template_file>\w+)"


def load_jupyter_server_extension(nbapp):
    """
    Called when the extension is loaded.

    Args:
        nbapp (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    nbapp.log.info("Custom server extension module enabled!")
    web_app = nbapp.web_app
    host_pattern = '.*$'
    route_pattern_dspace = url_path_join(web_app.settings['base_url'], '/dspace')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace, DSpaceHandler)])
    route_pattern_sword = url_path_join(web_app.settings['base_url'], '/sword')
    web_app.add_handlers(host_pattern, [(route_pattern_sword, SWORDHandler)])
    route_pattern_uploadbundle = url_path_join(web_app.settings['base_url'], '/uploadbundle')
    web_app.add_handlers(host_pattern, [(route_pattern_uploadbundle, UploadBundleHandler)])
    route_pattern_dspace_test = url_path_join(web_app.settings['base_url'], '/dspacetest')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace_test, TestDSpaceHandler)])
    route_pattern_ldap = url_path_join(web_app.settings['base_url'], '/ldap')
    web_app.add_handlers(host_pattern, [(route_pattern_ldap, LDAPHandler)])
    route_pattern_nbconvert = url_path_join(web_app.settings['base_url'], r"/nbconvert/%s/%s%s" % (_format_regex, _template_regex, path_regex))
    web_app.add_handlers(host_pattern, [(route_pattern_nbconvert, CustomNbconvertHandler)])


def _jupyter_server_extension_paths():
    return [{
        "module": "linker_extension"
    }]


def _jupyter_nbextension_paths():
    return [
        dict(
            section="tree",
            # the path is relative to the `my_fancy_module` directory
            src="static/tree/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/tree/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/tree/linker_extension_tree"),
        dict(
            section="notebook",
            # the path is relative to the `my_fancy_module` directory
            src="static/notebook/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/notebook/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/notebook/linker_extension_notebook"),
    ]
