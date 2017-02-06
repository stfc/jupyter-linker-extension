"""LDAP Tornado handlers for the notebook server that authenticate a user (post) or search the LDAP server (get)."""

import json
import ldap3
import re

from tornado import web, gen, escape

from notebook.utils import url_path_join
from notebook.base.handlers import (
    IPythonHandler, json_errors
)

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
        firstname = self.get_query_argument('firstname', default="")
        lastname = self.get_query_argument('lastname', default="")
        fedID = self.get_query_argument('fedID', default="")

        server = ldap3.Server('logon10.fed.cclrc.ac.uk', get_info=ldap3.ALL)

        conn = ldap3.Connection(server, auto_bind=True)

        result = []

        if firstname and not lastname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(givenName=*' + firstname + '*)',
                        attributes=['sn', 'givenName','cn','department','displayName'])
            result = conn.entries

        elif lastname and not firstname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(sn=*' + lastname + '*)',
                        attributes=['sn', 'givenName','cn','department','displayName'])
            result = conn.entries

        elif lastname and firstname and not fedID:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(&(sn=*' + lastname + '*)(givenName=*' + firstname + '*))',
                        attributes=['sn', 'givenName','cn','department','displayName'])
            result = conn.entries

        elif fedID and not firstname and not lastname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(cn=*' + fedID + '*)',
                        attributes=['sn', 'givenName','cn','department','displayName'])
            result = conn.entries
        else: #malformed request
            self.set_status(400)
            self.finish()
            return

        json_entries = []
        for entry in conn.entries:
            json_entries.append(entry.entry_to_json())

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
        json_obj = escape.json_decode(self.request.body)

        username = json_obj['username']
        password = json_obj['password']

        #stops ldap injection attacks by only allowing safe characters
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

        #invalid username
        if not re.match(valid_username_regex, username):
            self.set_status(400)
            self.finish()
            return None

        def getConnection(userdn, username, password):
            server = ldap3.Server('logon10.fed.cclrc.ac.uk', get_info=ldap3.ALL)

            conn = ldap3.Connection(server, user=userdn, password=password)
            return conn

        # try to bind the user using one of the templates
        for dn in bind_dn_template:
            userdn = dn.format(username=username)
            conn = getConnection(userdn, username, password)
            isBound = conn.bind()
            if isBound:
                break

        # either they're logged in (200) or they're not (401)
        if isBound:
            self.set_status(200)
            self.finish()
        else:
            self.set_status(401)
            self.finish()
