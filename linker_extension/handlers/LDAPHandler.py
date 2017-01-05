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
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(givenName=*' + firstname + '*)',
                        attributes=['sn', 'givenName'])
            result = conn.entries

        if lastname and not firstname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(sn=*' + lastname + '*)',
                        attributes=['sn', 'givenName'])
            result = conn.entries

        if lastname and firstname:
            conn.search('dc=fed,dc=cclrc,dc=ac,dc=uk',
                        '(&(sn=*' + lastname + '*)(givenName=*' + firstname + '*))',
                        attributes=['sn', 'givenName'])
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
