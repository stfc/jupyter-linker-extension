"""DSpace Tornado handlers used for testing."""

import requests
from requests_futures.sessions import FuturesSession
import os
import re
import shutil
import json

from tornado import web, gen, escape

from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig
from urllib.parse import urljoin


class DownloadHandler(IPythonHandler):

    # given a username and pass and a list of urls/purls/dois, access the bitstreams
    # of the items relating to them and save the files in the notebook folder in
    # subfolders
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        #TODO: surround json with try-catch
        config = LinkerExtensionConfig()
        dspace_url = config.dspace_url

        arguments = escape.json_decode(self.request.body)

        un = arguments['username']
        pw = arguments['password']
        URLs = arguments["URLs"]

        # login for token
        login_url = urljoin(dspace_url, "/rest/login")
        login_headers = {'Content-Type': 'application/json',
                         'Accept': 'application/json'}

        login = requests.request('POST',
                                 login_url,
                                 headers=login_headers,
                                 json={"email": un, "password": pw},
                                 verify=False)
        token = login.text

        session = FuturesSession()
        session.headers.update({
            'rest-dspace-token': token,
            'Content-Type': 'application/json'
        })

        headers = {'Accept': 'application/json'}

        # if they give the actual url then we can't search by metadata
        # field - so get all items (could be really slow...) and search by
        # handle TODO: this probably needs testing to see if it's super slow
        # with lots of items?
        find_requests = {}
        
        for url in URLs:
            if url.find(dspace_url) != -1:
                get_url = urljoin(dspace_url, "/rest/items/")
                r1 = session.get(get_url,verify=False)
                r1_json = r1.result().json()
                id = None
                for item_json in r1_json:
                    url_split = url.split("/")
                    # get handle be getting the last two elements of url_split
                    # and concatting them with /
                    handle = url_split[-2] + "/" + url_split[-1]
                    if handle == item_json["handle"]:
                        id = item_json["id"]
                        break
                
                item_url = urljoin(dspace_url, "/rest/items/" + str(id))
                find_request = session.get(item_url, verify=False)
                find_requests[url] = find_request
            else:
                if url.find("http") == -1: # plain doi - add dx.doi.org to the front
                    url = "http://dx.doi.org/" + url

                rest_url = urljoin(dspace_url, "/rest/items/find-by-metadata-field")
                find_request = session.post(rest_url,
                                           headers=headers,
                                           json={"key": "dc.identifier.uri",
                                                 "value": url},
                                           verify=False)
                find_requests[url] = find_request


        # get the bitstream ids
        get_bitstreams_requests = {}

        for key, value in find_requests.items():
            response = value.result()

            try:
                response_json = response.json()

                # if we do the search by metadata, we always get a list of dicts,
                # no matter whether it's a list of 1 item or not
                if type(response_json) is list:
                    id = response.json()[0]["id"]

                # however, if we search via handle and then just get the item we
                # just get the 1 dict that matches since we requested the item by id
                elif type(response_json) is dict:
                    id = response.json()["id"]

                # this should in theory never happen but just in case...
                else:
                    # error
                    raise web.HTTPError(500, "Response from eData when requesting " +
                                             "bitstreams was in an unanticipated " + 
                                             "format. Please try again and if " +
                                             "you continue to get this error, " +
                                             "please contact the developers.")
            except json.decoder.JSONDecodeError:
                id = None

            rest_url = "/rest/items/" + str(id) + "/bitstreams"
            get_bitstream_request = session.get(dspace_url + rest_url,headers=headers,verify=False)
            get_bitstreams_requests[key] = get_bitstream_request

        # get the content of the bitstreams (plus the name of the file and the name
        # of the item)
        get_content = {}
        for key, value in get_bitstreams_requests.items():
            response = value.result()
            get_content_requests = []

            try:
                for bitstream in response.json():
                    result = {}

                    # TODO: check that we only want to mess with the ORIGINAL bundle
                    # only download the files in the ORIGINAL bundle i.e. the ones
                    # shown in view/open section
                    if bitstream["bundleName"] == "ORIGINAL":
                        try:
                            response_json = find_requests[key].result().json()

                            # if we do the search by metadata, we always get a list of dicts,
                            # no matter whether it's a list of 1 item or not
                            if type(response_json) is list:
                                result["item_name"] = find_requests[key].result().json()[0]["name"]

                            # however, if we search via handle and then just get the item we
                            # just get the 1 dict that matches since we requested the item by id
                            elif type(response_json) is dict:
                                result["item_name"] = find_requests[key].result().json()["name"]

                            # this should in theory never happen but just in case...
                            else:
                                # error
                                raise web.HTTPError(500, "Response from eData when requesting " +
                                                         "bitstream content was in an unanticipated " + 
                                                         "format. Please try again and if " +
                                                         "you continue to get this error, " +
                                                         "please contact the developers.")
                        except json.decoder.JSONDecodeError:
                            result["item_name"] = None

                        result["bitstream_name"] = bitstream["name"] 
                        id = bitstream["id"]
                        rest_url = "/rest/bitstreams/" + str(id) + "/retrieve"
                        get_content_request = session.get(dspace_url + rest_url,headers=headers,verify=False)
                        result["bitstream_data_request"] = get_content_request
                        get_content_requests.append(result)

                get_content[key] = get_content_requests
            except json.decoder.JSONDecodeError:
                get_content[key] = []           

        result_dict = {};
        for url in URLs: # check each download to check everything ok
            if find_requests[url].result().status_code != 200:
                # fail on find via metadata.
                result_dict[url] = "Error! Failed trying to find the item in eData"
            else:
                if get_bitstreams_requests[url].result().status_code != 200:
                    # fail on get bistreams
                    result_dict[url] = "Error! Failed trying to list the bitstreams"
                else:
                    for result in get_content[url]:
                        if result["bitstream_data_request"].result().status_code != 200:
                            result_dict[url] = "Error! Failed trying to retrieve bitstream content"
                            break

            if len(get_content[url]) == 0:
                # shouldn't /really/ get this - users must specify a bitstream
                # when uploading. But you can delete all the bitstreams from an
                # existing item
                result_dict[url] = "Error! Found no bitstreams for the item"

            if url not in result_dict:
                #we succeeded - save the files into the notebook folder
                result_dict[url] = "Success!"

                index = ""
                cwd = os.getcwd()

                first_bistream = get_content[url][0]

                while True:
                    try:
                        path = cwd + "/" + first_bistream["item_name"] + index
                        os.makedirs(path)
                        break
                    except FileExistsError:
                        # create a directory using the number in brackets 
                        # system if a directory already exists - this is
                        # so we don't accidentally overwrite user files
                        if index:
                            index = '('+str(int(index[1:-1])+1)+')' # Append 1 to number in brackets
                        else:
                            index = "(1)"
                        continue
                    except OSError:
                        result_dict[url] = "Error! Failed when creating directory"
                        break

                if result_dict[url] == "Success!":
                    for bitstream in get_content[url]:
                        os.chdir(path)
                        try:
                            with open(bitstream["bitstream_name"],"w+b") as f:
                                f.write(bitstream["bitstream_data_request"].result().content)
                            os.chdir(cwd)
                        except OSError:
                            result_dict[url] = "Error! Failed when writing files"
                            os.chdir(cwd)
                            # clean up the folder so we don't have a half completed download
                            # TODO: is this sensible behaviour?
                            shutil.rmtree(path,ignore_errors=True)
                            break

        self.finish(result_dict)
