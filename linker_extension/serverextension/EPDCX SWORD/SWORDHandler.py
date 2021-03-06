"""DSpace Tornado handlers that upload a notebook to DSpace and
get the service document."""

import json
import requests
import os
import xml.etree.ElementTree as ET
import zipfile
import base64
import tempfile
import shutil

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
        ET.register_namespace("epdcx", "http://purl.org/eprint/epdcx/2006-11-16/")

        try:
            tree = ET.ElementTree(file=SWORDHandler.blank_file)
        except ET.ParseError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")

        root = tree.getroot()
        root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")

        try:
            metadata = tree.getroot()[1][0][0][0][0]
        except IndexError:
            raise web.HTTPError(500, "IndexError occured when "
                                     "fetching metadata node")
        title = arguments['title']
        # should never happen but just in case
        # TODO: publishing needs to check that required fields are filled
        # before sending (i.e that they're not sending empty metadata)
        if title is not '':
            title_xml = ET.SubElement(metadata,"epdcx:statement")
            title_xml.set("epdcx:propertyURI","http://purl.org/dc/elements/1.1/title")
            value = ET.SubElement(title_xml,"epdcx:valueString")
            value.text = title

        authors = arguments['authors']
        if authors is not []:
            if len(authors) > 0:
                for author in authors:
                    author_xml = ET.SubElement(metadata,"epdcx:statement")
                    author_xml.set("epdcx:propertyURI","http://purl.org/dc/elements/1.1/creator")
                    value = ET.SubElement(author_xml,"epdcx:valueString")
                    value.text = author

        abstract = arguments['abstract']
        if abstract is not '':  # shouldn't happen
            abstract_xml = ET.SubElement(metadata,"epdcx:statement")
            abstract_xml.set("epdcx:propertyURI","http://purl.org/dc/terms/abstract")
            value = ET.SubElement(abstract_xml,"epdcx:valueString")
            value.text = abstract

        tags = arguments['tags']
        if tags is not []:
            if len(tags) > 0:
                for tag in tags:
                    tag_xml = ET.SubElement(metadata,"epdcx:statement")
                    tag_xml.set("epdcx:propertyURI","http://purl.org/dc/elements/1.1/subject")
                    value = ET.SubElement(tag_xml,"epdcx:valueString")
                    value.text = tag

        date = arguments['date']
        if date is not '':  # shouldn't happen
            # date string is already in the format we need
            date_xml = ET.SubElement(metadata,"epdcx:statement")
            date_xml.set("epdcx:propertyURI","http://purl.org/dc/terms/issued")
            value = ET.SubElement(date_xml,"epdcx:valueString")
            value.text = date

        language = arguments['language']
        if language is not '':
            language_xml = ET.SubElement(metadata,"epdcx:statement")
            language_xml.set("epdcx:propertyURI","http://purl.org/dc/elements/1.1/language")
            language_xml.set("epdcx:sesURI","http://purl.org/dc/terms/ISO3166")
            value = ET.SubElement(language_xml,"epdcx:valueString")
            value.text = language

        publisher = arguments['publisher']
        if publisher is not '':
            publisher_xml = ET.SubElement(metadata,"epdcx:statement")
            publisher_xml.set("epdcx:propertyURI","http://purl.org/dc/elements/1.1/publisher")
            value = ET.SubElement(publisher_xml,"epdcx:valueString")
            value.text = publisher


        citations = arguments['citations']
        if citations is not []:
            if len(citations) > 0:
                for citation in citations:
                    citation_xml = ET.SubElement(metadata,"epdcx:statement")
                    citation_xml.set("epdcx:propertyURI","http://purl.org/dc/terms/bibliographicCitation")
                    value = ET.SubElement(citation_xml,"epdcx:valueString")
                    value.text = citation

        referencedBys = arguments['referencedBy']
        if referencedBys is not []:
            if len(referencedBys) > 0:
                for referencedBy in referencedBys:
                    referencedBy_xml = ET.SubElement(metadata,"epdcx:statement")
                    referencedBy_xml.set("epdcx:propertyURI","http://purl.org/dc/terms/isReferencedBy")
                    value = ET.SubElement(referencedBy_xml,"epdcx:valueString")
                    value.text = referencedBy

        # TODO: figure out a way to do funders and sponsors?
        # or get rid of them
        funders = arguments['funders']
        if funders is not "":
            funders_xml = ET.SubElement(metadata,"epdcx:statement")
            funders_xml.set("epdcx:propertyURI","http://www.loc.gov/loc.terms/relators/FND")
            value = ET.SubElement(funders_xml,"epdcx:valueString")
            value.text = funders

        #sponsors = arguments['sponsors']
        #if funders is not None:
        #    metadata.append({"key": "dc.description.sponsorship", "value": sponsors})

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

        licence_file_name = arguments['licence_file_name']
        licence_file_contents = arguments['licence_file_contents']
        licence_preset = arguments['licence_preset']
        licence_url = arguments['licence_url']

        licence_file_path = ""
        try:
            tempdir = tempfile.mkdtemp()
            os.chdir(tempdir)
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when opening tem dir")

        try:
            if licence_preset == "Other":
                if licence_url != "":
                    with open("LICENSE.txt", "w") as f:
                        f.write("Licence located at: ")
                        f.write(licence_url)
                        f.write("\n")
                else:
                    base64_data = licence_file_contents.split(",")[1]

                    encoding_info = licence_file_contents.split(",")[0]
                    encoding_info = encoding_info.split(";")[0]
                    encoding_info = encoding_info.split(":")[1]

                    with open(licence_file_name, "wb") as f:
                        f.write(base64.decodestring(base64_data.encode("utf-8")))
            else:
                licence_file_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "resources",
                    "licences",
                    licence_preset,
                    "LICENSE.txt"
                )
        except:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when sorting out licence file")

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
            shutil.rmtree(tempdir)
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
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IndexError when getting"
                                     "'struct' root node")

        try:
            # this is writing to the cwd - might need to change?
            # TODO: check that this is still sensible
            tree.write("mets.xml", encoding='UTF-8', xml_declaration=True)
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when writing tree to mets.xml")

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
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "Error when writing zip file")
        finally:
            created_zip_file.close()
        try:
            with open("notebook.zip", "rb") as f:
                binary_zip_file = f.read()
        except IOError:
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "IOError when reading zip file "
                                     "as binary data")
        os.chdir(notebook_dir)

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

        if(r.status_code == 201):
            shutil.rmtree(tempdir)
            self.clear()
            self.set_status(201)
            self.finish(r.text)
        elif (r.status_code == 202):
            shutil.rmtree(tempdir)
            self.clear()
            self.set_status(202)
            self.finish(r.text)
        else:  # Still failed even after the retries
            shutil.rmtree(tempdir)
            raise web.HTTPError(500, "Requests failed after 5 retries")
