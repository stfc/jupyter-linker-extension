"""
LDAP Tornado handlers for the notebook server that authenticate a user
(post) or search the LDAP server (get).
"""

import json
import ldap3
from ldap3.core.exceptions import LDAPExceptionError
import re

from tornado import web, gen, escape

from notebook.utils import url_path_join
from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from linker_extension.serverextension.ConfigHandler import LinkerExtensionConfig

# ----------------------------------------------------------------------------
# LDAP handler
# ----------------------------------------------------------------------------


class LDAPHandler(IPythonHandler):

    # searches the ldap server for a user via their names or via fedID
    # returns a list of users that match, with the attributes listed below
    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        config = LinkerExtensionConfig()
        server_url = config.ldap_server

        firstname = self.get_query_argument('firstname', default="")
        lastname = self.get_query_argument('lastname', default="")
        fedID = self.get_query_argument('fedID', default="")

        server = ldap3.Server(server_url, port=636, use_ssl=True)

        # test if server url is valid
        try:
            conn = ldap3.Connection(server, auto_bind=True)
        except LDAPExceptionError as e:
            raise web.HTTPError(404, "LDAPEXceptionError when trying to " +
                                     "connect to the LDAP server. " +
                                     "Please check the LDAP server url in " +
                                     "the config, located at ~/.jupyter/" +
                                     "linker_extension_config.ini, "
                                     "and try again. If the error " +
                                     "persists, please contact the developers")

        result = []

        if firstname and not lastname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(givenName=*' + firstname + '*)',
                        attributes=['sn', 'givenName', 'cn', 'displayName', 'department'])
            result = conn.entries

        elif lastname and not firstname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(sn=*' + lastname + '*)',
                        attributes=['sn', 'givenName', 'cn', 'displayName', 'department'])
            result = conn.entries

        elif lastname and firstname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(&(sn=*' + lastname + '*)(givenName=*' + firstname + '*))',
                        attributes=['sn', 'givenName', 'cn', 'displayName', 'department'])
            result = conn.entries

        elif fedID and not firstname and not lastname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(cn=' + fedID + ')',
                        attributes=['sn', 'givenName', 'cn', 'displayName', 'department'])
            result = conn.entries
        else:  # malformed request
            raise web.HTTPError(400, "Invalid request. If the error " +
                                     "persists, please contact the developers")

        json_entries = []
        for entry in conn.entries:
            json_entries.append(entry.entry_to_json())

        conn.unbind()
        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps(json_entries))

    # this is used to authenticate a user via ldap.
    # requires a username and password via the request body
    # returns nothing, but the status code of the response is used to determine
    # what happened
    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        config = LinkerExtensionConfig()
        server_url = config.ldap_server

        json_obj = escape.json_decode(self.request.body)

        username = json_obj['username']
        password = json_obj['password']

        if username is "" and password is "":
            raise web.HTTPError(400, "Please enter a username and password")

        if username is "":
            raise web.HTTPError(400, "Please enter a username")

        if password is "":
            raise web.HTTPError(400, "Please enter a password")


        # stops ldap injection attacks by only allowing safe characters
        valid_username_regex = r'^[a-z][.a-z0-9_-]*$'

        # bind_dn_template lists all the bind templates that a user could have
        # TODO: check that this covers everyone/most people
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

        # invalid username
        if not re.match(valid_username_regex, username):
            raise web.HTTPError(400, "Invalid username. If the error " +
                                     "persists, please contact the developers")

        def getConnection(userdn, username, password):
            server = ldap3.Server(server_url, port=636, use_ssl=True)

            conn = ldap3.Connection(server, user=userdn, password=password)
            return conn

        # see if the server url is valid
        try:
            conn = getConnection("", "", "")
            conn.bind()
            conn.unbind()
        except LDAPExceptionError as e:
            raise web.HTTPError(404, "LDAPExceptionError when trying to " +
                                     "connect to the LDAP server. " +
                                     "Please check the LDAP server url in " +
                                     "the config, located at ~/.jupyter/" +
                                     "linker_extension_config.ini, "
                                     "and try again. If the error " +
                                     "persists, please contact the developers")

        # try to bind the user using one of the templates
        for dn in bind_dn_template:
            userdn = dn.format(username=username)
            conn = getConnection(userdn, username, password)
            isBound = conn.bind()
            conn.unbind()
            if isBound:
                break

        # either they're logged in (200) or they're not (401)
        if isBound:
            self.set_status(200)
            self.finish()
        else:
            raise web.HTTPError(401, "The username and password combination " +
                                     "entered is incorrect - please try " +
                                     "again. If the error persists, please " +
                                     "contact the developers")
