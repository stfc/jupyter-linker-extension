
from tornado import web, gen, escape
from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from jupyter_core.paths import jupyter_config_dir

import configparser


class ConfigHandler(IPythonHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        json_obj = escape.json_decode(self.request.body)
        username = json_obj['username']

        try:
            config = LinkerExtensionConfig()
        except OSError as e:
            raise web.HTTPError(500, e.args[0])

        try:
            config.set("Username", username)
        except OSError as e:
            raise web.HTTPError(500, e.args[0])
        else:
            self.set_status(200)
            self.finish()

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        try:
            config = LinkerExtensionConfig()
        except OSError as e:
            raise web.HTTPError(500, e.args[0])

        response = {
            "username": config.username,
            "ldap_server": config.ldap_server,
            "dspace_url": config.dspace_url
        }
        self.set_status(200)
        self.finish(response)


class LinkerExtensionConfig():
    username = ""
    ldap_server = ""
    dspace_url = ""

    def __init__(self):
        config = configparser.ConfigParser(allow_no_value=True)

        config_dir = jupyter_config_dir()

        try:
            new_file = False
            with open(config_dir + "/linker_extension_config.ini", "r") as f:
                config.read_file(f)

        except FileNotFoundError:
            new_file = True
        except OSError as e:
            raise OSError("OSError when reading config file during config initialisation")

        if new_file:
            config.add_section("LINKER EXTENSION CONFIG")
            config.set("LINKER EXTENSION CONFIG", "Username Help", "specify your federal id")
            config.set("LINKER EXTENSION CONFIG", "Username", "")
            self.username = ""
            config.set("LINKER EXTENSION CONFIG", "LDAP Server Help", "specify the ldap server to authenticate against")
            config.set("LINKER EXTENSION CONFIG", "LDAP Server", "ralfed.cclrc.ac.uk")
            self.ldap_server = "logon10.fed.cclrc.ac.uk"
            config.set("LINKER EXTENSION CONFIG", "DSpace URL Help", "specify the dspace url to upload to")
            config.set("LINKER EXTENSION CONFIG", "DSpace URL", "https://epublicns05.esc.rl.ac.uk/")
            self.dspace_url = "https://epublicns05.esc.rl.ac.uk/"

            try:
                with open(config_dir + "/linker_extension_config.ini", "w") as f:
                    config.write(f)
            except OSError as e:
                raise OSError("OSError when writing config file during config initialisation")
        else:
            linker_config = config["LINKER EXTENSION CONFIG"]

            self.username = linker_config.get("Username", "")

            self.ldap_server = linker_config.get("LDAP Server", "")

            self.dspace_url = linker_config.get("DSpace URL", "")

    def set(self, option, value):
        config = configparser.ConfigParser()
        config_dir = jupyter_config_dir()

        try:
            with open(config_dir + "/linker_extension_config.ini", "r") as f:
                config.read_file(f)
        except OSError:
            raise OSError("OSError when reading config file when updating the config")

        config.set("LINKER EXTENSION CONFIG", option, value)

        try:
            with open(config_dir + "/linker_extension_config.ini", "w") as f:
                config.write(f)
        except OSError:
            raise OSError("OSError when writing config file when updating the config")
