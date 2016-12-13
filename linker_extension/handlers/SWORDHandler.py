"""DSpace Tornado handlers that upload a notebook to DSpace and get the service document."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


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