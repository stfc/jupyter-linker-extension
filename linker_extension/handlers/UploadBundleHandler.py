"""DSpace Tornado handlers that upload a bundle to DSpace."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile
import tempfile
import shutil
import base64

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class UploadBundleHandler(IPythonHandler):

    blank_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "blank.xml")

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']

        repository = arguments['repository']

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

        title = arguments['title']

        # should never happen but just in case
        # TODO: publishing needs to check that required fields are filled
        # before sending (i.e that they're not sending empty metadata)
        if title is not '':
            title_xml = ET.Element("dc:title")
            title_xml.text = title
            metadata.append(title_xml)

        authors = arguments['authors']
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    author_xml = ET.Element("dc:creator")
                    author_xml.text = author
                    metadata.append(author_xml)

        abstract = arguments['abstract']
        if abstract is not '':  # shouldn't happen
            abstract_xml = ET.Element("dcterms:abstract")
            abstract_xml.text = abstract
            metadata.append(abstract_xml)

        tags = arguments['tags']
        if tags is not []:
            if len(tags) > 0:
                for tag in tags:
                    tag_xml = ET.Element("dc:subject")
                    tag_xml.text = tag
                    metadata.append(tag_xml)

        date = arguments['date']
        if date is not '':  # shouldn't happen
            # date string is already in the format we need
            date_xml = ET.Element("dcterms:issued")
            date_xml.text = date
            metadata.append(date_xml)

        language = arguments['language']
        if language is not '':
            language_xml = ET.Element("dc:language")
            language_xml.text = language
            metadata.append(language_xml)

        publisher = arguments['publisher']
        if publisher is not '':
            publisher_xml = ET.Element("dc:publisher")
            publisher_xml.text = publisher
            metadata.append(publisher_xml)

        citations = arguments['citations']
        if citations is not []:
            if len(citations) > 0:
                for citation in citations:
                    citation_xml = ET.Element("dcterms:bibliographicCitation")
                    citation_xml.text = citation
                    metadata.append(citation_xml)

        referencedBys = arguments['referencedBy']
        if referencedBys is not []:
            if len(referencedBys) > 0:
                for referencedBy in referencedBys:
                    reference_xml = ET.Element("dcterms:isReferencedBy")
                    reference_xml.text = referencedBy
                    metadata.append(reference_xml)

        reference_xml = ET.Element("dc:type")
        reference_xml.text = "Dataset"
        metadata.append(reference_xml)

        # TODO: figure out a way to do funders and sponsors?
        # or get rid of them
        #funders = arguments['funders']
        #if funders is not None:
        #    metadata.append({"key": "dc.contributor.funder", "value": funders})

        #sponsors = arguments['sponsors']
        #if funders is not None:
        #    metadata.append({"key": "dc.description.sponsorship", "value": sponsors})

        try:
            notebook_path = arguments['notebookpath']
            notebook_split = notebook_path.split('/')
            notebook_name = notebook_split[-1]  # get last bit of path
            notebook_dir = os.getcwd()
        except web.MissingArgumentError:
            raise web.HTTPError(500, "MissingArgumentError occured - "
                                     "notebook path isn't specified")
        except IndexError:
            raise web.HTTPError(500, "IndexError when parsing notebook_path")

        file_names = arguments['file_names']
        file_paths = arguments['file_paths']
        file_types = arguments['file_types']

        TOS_files = arguments["TOS"]

        try:
            tempdir = tempfile.mkdtemp()
            os.chdir(tempdir)
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when opening temp dir")

        try:
            for index, file in enumerate(TOS_files):
                base64_data = file.split(",")[1]

                encoding_info = file.split(",")[0]
                encoding_info = encoding_info.split(";")[0]
                encoding_info = encoding_info.split(":")[1]

                with open("TOS " + str(index), "wb") as f:
                    f.write(base64.decodestring(base64_data.encode("utf-8")))
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when writing the TOS files")

        try:
            files = tree.getroot()[2][0]
            id_count = 0
            if file_paths is not []:  # TODO: enforce that this doesn't happen
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
            for i in list(range(0,len(TOS_files))):
                file_attr = {"GROUPID": "TOS-File-" + str(i),
                             "ID": "TOS " + str(i),
                             "MIMETYPE": encoding_info}
                files_xml = ET.Element('file', file_attr)

                FLocat_attr = {"LOCTYPE": "URL",
                               "xlink:href": "TOS " + str(i)}
                FLocat_xml = ET.Element('FLocat', FLocat_attr)

                files_xml.append(FLocat_xml)
                files.append(files_xml)

        except IndexError:
            shutil.rmtree(tempdir)
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

            for i in list(range(0,len(TOS_files))):
                TOS_struct_attr = {"ID": "sword-mets-div-2",
                                   "DMDID": "sword-mets-dmd-2",
                                   "TYPE": "TOS"}
                TOS_struct_xml = ET.Element('div', TOS_struct_attr)

                TOS_struct_child_attr = {"ID": "sword-mets-div-2", "TYPE": "File"}
                TOS_struct_xml_child = ET.Element('div', TOS_struct_child_attr)

                TOS_fptr_xml = ET.Element("ftpr", {"FILEID": "TOS " + str(i)})

                TOS_struct_xml_child.append(TOS_fptr_xml)
                TOS_struct_xml.append(TOS_struct_xml_child)
                struct.append(TOS_struct_xml)

        except IndexError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IndexError when getting "
                                     "'struct' root node")

        try:
            # this is writing to the cwd - might need to change?
            # TODO: check that this is still sensible
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when writing tree to mets.xml")

        try:
            created_zip_file = zipfile.ZipFile("data_bundle.zip", "w")
            created_zip_file.write("mets.xml")
            if file_paths is not []:
                if len(file_paths) > 0:
                    for file_path in file_paths:
                        created_zip_file.write(notebook_dir + "/" + file_path, file_path)

            for i in list(range(0,len(TOS_files))):
                created_zip_file.write("TOS " + str(i))

        except:  # dunno what exceptions we might encounter here
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "Error when writing zip file")
        finally:
            created_zip_file.close()

        try:
            with open("data_bundle.zip", "rb") as f:
                binary_zip_file = f.read()
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when reading zip file"
                                     "as binary data")

        os.chdir(notebook_dir)

        notebook_name_no_extension = notebook_name.split(".")[0]

        url = ("https://epublicns05.esc.rl.ac.uk/sword/deposit/" +
               repository)

        headers = {"Content-Disposition": ("filename=" +
                                           notebook_name_no_extension +
                                           " Data.zip"),
                   "Content-Type": "application/zip",
                   "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP",
                   "X-On-Behalf-Of": un}

        try:
            r = requests.request('POST',
                                 url,
                                 headers=headers,
                                 data=binary_zip_file,
                                 verify=False,
                                 auth=(un, pw))
            # TODO: add authenication to the request
        except requests.exceptions.RequestException:
            shutil.rmtree(tempdir)
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
                shutil.rmtree(tempdir)
                raise web.HTTPError(500, "Requests made an error")

            print(r.status_code)
            retries -= 1

        if(r.status_code == 201):  # created
            shutil.rmtree(tempdir)
            self.clear()
            self.set_status(201)
            print(r.text)
            self.finish(r.text)
        elif (r.status_code == 202):  # accepted (waiting for approval)
            shutil.rmtree(tempdir)
            self.clear()
            self.set_status(202)
            print(r.text)
            self.finish(r.text)
        else:  # Still failed even after the retries
            shutil.rmtree(tempdir)
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
