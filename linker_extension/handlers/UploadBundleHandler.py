"""DSpace Tornado handlers that upload a bundle to DSpace."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile

from tornado import web, gen

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class UploadBundleHandler(IPythonHandler):

    admin_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "admin.txt")

    blank_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "blank.xml")

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        username = self.get_query_argument('username')

        repository = self.get_query_argument('repository')
        try:
            with open(UploadBundleHandler.admin_file, "r") as f:
                    un = f.readline().strip()
                    pw = f.readline().strip()
        except IOError:
            raise web.HTTPError(500, "IOError occured when opening"
                                     "login details file")

        ET.register_namespace("", "http://www.loc.gov/METS/")
        ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
        ET.register_namespace("dc", "http://purl.org/dc/elements/1.1/")
        ET.register_namespace("dcterms", "http://purl.org/dc/terms/")

        try:
            tree = ET.ElementTree(file=UploadBundleHandler.blank_file)
        except ET.ParseError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")

        root = tree.getroot()
        root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")
        root.set("xmlns:dc", "http://purl.org/dc/elements/1.1/")
        root.set("xmlns:dcterms", "http://purl.org/dc/terms/")

        try:
            metadata = tree.getroot()[1][0][0]
        except IndexError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")

        title = self.get_query_argument('title', default=None)

        # should never happen but just in case
        # TODO: publishing needs to check that required fields are filled
        # before sending (i.e that they're not sending empty metadata)
        if title is not None:
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

        # TODO: figure out a way to do funders and sponsors?
        # or get rid of them
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
            raise web.HTTPError(500, "MissingArgumentError occured - "
                                     "notebook path isn't specified")
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
                            file_attr = {"GROUPID": "sword-mets-fgid-" + str(id_count),
                                         "ID": file_path,
                                         "MIMETYPE": "application/octet-stream"}
                            files_xml = ET.Element('file', file_attr)

                            FLocat_attr = {"LOCTYPE": "URL",
                                           "xlink:href": file_path}
                            FLocat_xml = ET.Element('FLocat', FLocat_attr)

                            files_xml.append(FLocat_xml)
                            files.append(files_xml)
                            id_count += 1
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting"
                                     "'files' root node")

        try:
            struct = tree.getroot()[3]

            struct_attr = {"ID": "sword-mets-div-1",
                           "DMDID": "sword-mets-dmd-1",
                           "TYPE": "SWORD Object"}
            struct_xml = ET.Element('div', struct_attr)

            if file_paths is not []:
                if len(file_names) > 0:
                    for index, file_path in enumerate(file_paths):
                        file_type = file_types[index]
                        helper.dir_search(file_path,
                                          file_type,
                                          struct_xml)
            struct.append(struct_xml)

        except IndexError:
            raise web.HTTPError(500, "IndexError when getting "
                                     "'struct' root node")

        try:
            # this is writing to the cwd - might need to change?
            # TODO: check that this is still sensible
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)
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
            raise web.HTTPError(500, "IOError when reading zip file"
                                     "as binary data")

        notebook_name_no_extension = notebook_name.split(".")[0]

        url = ("https://epublicns05.esc.rl.ac.uk/sword/deposit/" +
               repository)

        headers = {"Content-Disposition": ("filename=" +
                                           notebook_name_no_extension +
                                           " Data.zip"),
                   "Content-Type": "application/zip",
                   "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP",
                   "X-On-Behalf-Of": username}

        try:
            r = requests.request('POST',
                                 url,
                                 headers=headers,
                                 data=binary_zip_file,
                                 verify=False,
                                 auth=(un, pw))
            # TODO: add authenication to the request
        except requests.exceptions.RequestException:
            raise web.HTTPError(500, "Requests made an error")

        print(r.status_code)  # TODO: remove later
        retries = 5

        while (r.status_code != 201 and
               r.status_code != 202 and
               retries >= 0):
            # SWORD sometimes randomly fails to send a request so retry
            # a couple of times
            try:
                r = requests.request('POST',
                                     url,
                                     headers=headers,
                                     data=binary_zip_file,
                                     verify=False,
                                     auth=(un, pw))

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


class helper:
    # helper method that given a file path creates the xml nodes for each
    # directory on the path as chidren to the parent node supplied. It searches
    # to see if a directory already exists and if it does then adds any new
    # directories and files to the existing node, otherwise it just creates
    # one. This creates the correct structure that SWORD requires.
    @staticmethod
    def dir_search(path, file_type, parent_node):
        path_arr = path.split("/")
        curr_node = parent_node
        for index, item in enumerate(path_arr, start=0):
            # Need to check if directory already exists
            existing_div = None
            for div in curr_node.findall('div'):
                if(div.get("ID") == "/".join(path_arr[:(index+1)])):
                    existing_div = div

            # We only create a new div if there is no existing directory div,
            # otherwise we use the old one
            if existing_div is not None:
                curr_node = existing_div
            else:
                if(file_type == 'file'):
                    struct_xml_child = ET.Element('div', {"ID": path,
                                                          "TYPE": "File"})
                    fptr_xml = ET.Element("ftpr", {"FILEID": path})
                    struct_xml_child.append(fptr_xml)
                    curr_node.append(struct_xml_child)

                else:
                    struct_child_attr = {"ID": "/".join(path_arr[:(index+1)]),
                                         "TYPE": "Directory"}
                    struct_xml_child = ET.Element('div', struct_child_attr)
                    curr_node.append(struct_xml_child)
                    curr_node = struct_xml_child
