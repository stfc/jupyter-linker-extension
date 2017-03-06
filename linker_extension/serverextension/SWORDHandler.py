"""DSpace Tornado handlers that upload a notebook to DSpace and
get the service document."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile
import base64
from tempfile import TemporaryDirectory

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig
from urllib.parse import urljoin


class SWORDHandler(IPythonHandler):

    blank_file = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                              "resources",
                              "blank.xml")

    # create a new notebook item
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        # get the arguments from the request body
        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']

        repository = arguments['repository']

        # ET = ElementTree which is how python works easily with XML
        # register the namespaces that are used
        ET.register_namespace("", "http://www.loc.gov/METS/")
        ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
        ET.register_namespace("dc", "http://purl.org/dc/elements/1.1/")
        ET.register_namespace("dcterms", "http://purl.org/dc/terms/")

        # try opening our blank file as an ElementTree
        try:
            tree = ET.ElementTree(file=SWORDHandler.blank_file)
        except ET.ParseError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")

        # get the root, and add in some attributes
        root = tree.getroot()
        root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")
        root.set("xmlns:dc", "http://purl.org/dc/elements/1.1/")
        root.set("xmlns:dcterms", "http://purl.org/dc/terms/")

        # fetch the metadata node. all our metadata but be a child of this node
        try:
            metadata = tree.getroot()[1][0][0]
        except IndexError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")

        # get each piece of metadata from the request body and create a node/nodes
        # in the xml doc for them

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
                    concat_author = ", ".join(author)
                    author_xml = ET.Element("dc:creator")
                    author_xml.text = concat_author
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

        # TODO: figure out a way to do funders and sponsors?
        # or get rid of them
        #funders = arguments['funders']
        #if funders is not None:
        #    metadata.append({"key": "dc.contributor.funder", "value": funders})

        #sponsors = arguments['sponsors']
        #if funders is not None:
        #    metadata.append({"key": "dc.description.sponsorship", "value": sponsors})


        # transform the notebook path given by jupyter to an actual system path.
        # also get the notebook name so that we cna use it to name the file.
        try:
            notebook_path = arguments['notebookpath']
            notebook_split = notebook_path.split('/')
            notebook_name = notebook_split[-1]  # get last bit of path
            notebook_dir = os.getcwd()
            notebook_full_path = notebook_dir + "/" + notebook_path
        except web.MissingArgumentError:
            raise web.HTTPError(500, "MissingArgumentError occured - "
                                     "notebook path isn't specified")
        except IndexError:
            raise web.HTTPError(500, "IndexError when parsing notebook_path")

        # deal with the licence. try getting the licence file and contents if
        # specified. also get the preset and url.

        licence_file_name = ""
        licence_file_contents = ""
        if "licence_file_name" in arguments:
            licence_file_name = arguments['licence_file_name']
        if "licence_file_contents" in arguments:
            licence_file_contents = arguments['licence_file_contents']
            
        licence_preset = arguments['licence_preset']
        licence_url = arguments['licence_url']

        licence_file_path = ""

        # make a temporary directory for us to play around in since we're
        # creating files
        try:
            t = TemporaryDirectory()
            tempdir = t.name
            os.chdir(tempdir)
        except OSError:
            raise web.HTTPError(500, "OSError when opening temp dir")

        # determine what our licence path is going to be and, if needed, write
        # a licence file. if we were passed a licence file we can create a file
        # from the name and contents. if a licene url - create a file which tells
        # you where the licence is found. If a preset, set licence file path to 
        # be the relevant preset file.
        try:
            if licence_preset == "Other":
                if licence_url != "":
                    with open("LICENSE.txt", "w") as f:
                        f.write("Licence located at: ")
                        f.write(licence_url)
                        f.write("\n")
                elif licence_file_name != "" and licence_file_contents != "":

                    base64_data = licence_file_contents.split(",")[1]
                    print(base64_data)

                    encoding_info = licence_file_contents.split(",")[0]
                    encoding_info = encoding_info.split(";")[0]
                    encoding_info = encoding_info.split(":")[1]

                    with open(licence_file_name, "wb") as f:
                        f.write(base64.decodestring(base64_data.encode("utf-8")))
                else:
                    raise web.HTTPError(500, "No licence?")
            else:
                licence_file_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "resources",
                    "licences",
                    licence_preset,
                    "LICENSE.txt"
                )
        except:
            raise web.HTTPError(500, "OSError when sorting out licence file")

        # now we need to specify the files contained in the sword package.
        # realistically, this is just the notebook file itself and the licence.
        # we have to create specific xml nodes for our files with specific
        # attributes.
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

            if licence_preset == "Other" and licence_url == "":
                licence_attr = {"GROUPID": "sword-mets-fgid-1",
                                "ID": "sword-mets-file-2",
                                "MIMETYPE": encoding_info}
                licence_xml = ET.Element('file', licence_attr)

                licence_FLocat_attr = {"LOCTYPE": "URL", "xlink:href": licence_file_name}
                licence_FLocat_xml = ET.Element('FLocat', licence_FLocat_attr)
            else:
                licence_attr = {"GROUPID": "sword-mets-fgid-1",
                                "ID": "sword-mets-file-2",
                                "MIMETYPE": "text/plain"}
                licence_xml = ET.Element('file', licence_attr)

                licence_FLocat_attr = {"LOCTYPE": "URL", "xlink:href": "LICENSE.txt"}
                licence_FLocat_xml = ET.Element('FLocat', licence_FLocat_attr)

            licence_xml.append(licence_FLocat_xml)
            files.append(licence_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting "
                                     "'files' root node")

        # now we have to create the structure. for this, pretty much the same
        # as the files node.
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

            licence_struct_attr = {"ID": "sword-mets-div-2",
                                   "DMDID": "sword-mets-dmd-2",
                                   "TYPE": "License"}
            licence_struct_xml = ET.Element('div', licence_struct_attr)

            licence_struct_child_attr = {"ID": "sword-mets-div-2", "TYPE": "File"}
            licence_struct_xml_child = ET.Element('div', licence_struct_child_attr)

            licence_fptr_xml = ET.Element("ftpr", {"FILEID": "sword-mets-file-2"})

            licence_struct_xml_child.append(licence_fptr_xml)
            licence_struct_xml.append(licence_struct_xml_child)
            struct.append(licence_struct_xml)
        except IndexError:
            raise web.HTTPError(500, "IndexError when getting"
                                     "'struct' root node")

        try:
            # write our tree to mets.xml in preparation to be uploaded
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)
        except OSError:
            raise web.HTTPError(500, "OSError when writing tree to mets.xml")

        # create a zip file for our sword submission. Write mets.xml,
        # our notebook file and the licence file to the zip.
        # TODO: might need to zip the notebook and licence together
        try:
            created_zip_file = zipfile.ZipFile("notebook.zip", "w")
            created_zip_file.write("mets.xml")
            created_zip_file.write(notebook_full_path, notebook_name)

            if licence_preset == "Other":
                if licence_url != "":
                    created_zip_file.write("LICENSE.txt")
                else:
                    created_zip_file.write(licence_file_name)
            else:
                created_zip_file.write(licence_file_path, "LICENSE.txt")

        except:  # dunno what exceptions we might encounter here
            raise web.HTTPError(500, "Error when writing zip file")
        finally:
            # close the zip either way
            created_zip_file.close()

        # reading the newly created zip file as binary so we can send it via
        # a http request
        try:
            with open("notebook.zip", "rb") as f:
                binary_zip_file = f.read()
        except OSError:
            raise web.HTTPError(500, "OSError when reading zip file "
                                     "as binary data")

        # get out of our temp directory and back to the notebook directory
        os.chdir(notebook_dir)

        # set up some variables needed for the request
        notebook_name_no_extension = notebook_name.split(".")[0]

        url = urljoin(dspace_url, "sword/deposit/" + repository)

        headers = {"Content-Disposition": ("filename=" +
                                           notebook_name_no_extension +
                                           ".zip"),
                   "Content-Type": "application/zip",
                   "X-Packaging": "http://purl.org/net/sword-types/METSDSpaceSIP",
                   "X-On-Behalf-Of": un}

        # try sending off the request
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

        # Delete temp directory and pass along the status code and request text
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
