"""DSpace Tornado handlers that upload a notebook to DSpace and
get the service document."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)


class SWORDHandler(IPythonHandler):

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
            tree = ET.ElementTree(file=SWORDHandler.blank_file)
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

        citation = arguments['citation']
        if citation is not '':
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
            notebook_name = notebook_split[-1]
            notebook_dir = os.getcwd()
            full_path = notebook_dir + "/" + notebook_path
        except web.MissingArgumentError:
            raise web.HTTPError(500, "MissingArgumentError occured - "
                                     "notebook path isn't specified")
        except IndexError:
            raise web.HTTPError(500, "IndexError when parsing notebook_path")

        try:
            files = tree.getroot()[2][0]

            file_attr = {"GROUPID": "sword-mets-fgid-0",
                         "ID": "sword-mets-file-1",
                         "MIMETYPE": "application/octet-stream"}
            files_xml = ET.Element('file', file_attr)

            FLocat_attr = {"LOCTYPE": "URL", "xlink:href": notebook_name}
            FLocat_xml = ET.Element('FLocat', FLocat_attr)

            files_xml.append(FLocat_xml)
            files.append(files_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting "
                                     "'files' root node")

        try:
            struct = tree.getroot()[3]

            struct_attr = {"ID": "sword-mets-div-1",
                           "DMDID": "sword-mets-dmd-1",
                           "TYPE": "SWORD Object"}
            struct_xml = ET.Element('div', struct_attr)

            struct_child_attr = {"ID": "sword-mets-div-2", "TYPE": "File"}
            struct_xml_child = ET.Element('div', struct_child_attr)

            fptr_xml = ET.Element("ftpr", {"FILEID": "sword-mets-file-1"})

            struct_xml_child.append(fptr_xml)
            struct_xml.append(struct_xml_child)
            struct.append(struct_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting"
                                     "'struct' root node")

        try:
            # this is writing to the cwd - might need to change?
            # TODO: check that this is still sensible
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)
        except IOError:
            raise web.HTTPError(500, "IOError when writing tree to mets.xml")

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
            raise web.HTTPError(500, "IOError when reading zip file "
                                     "as binary data")

        notebook_name_no_extension = notebook_name.split(".")[0]

        url = ("https://epublicns05.esc.rl.ac.uk/sword/deposit/" +
               repository)

        headers = {"Content-Disposition": ("filename=" +
                                           notebook_name_no_extension +
                                           ".zip"),
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
