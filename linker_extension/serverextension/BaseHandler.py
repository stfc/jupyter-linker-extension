from notebook.base.handlers import (
    IPythonHandler, json_errors
)
from jupyter_core.paths import jupyter_config_dir

import configparser


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
        except:
            print("Error reading config file")

        if new_file:
            config.add_section("LINKER EXTENSION CONFIG")
            config.set("LINKER EXTENSION CONFIG", "# specify your federal id")
            config.set("LINKER EXTENSION CONFIG", "Username", "")
            self.username = ""
            config.set("LINKER EXTENSION CONFIG", "# specify the ldap server to authenticate against")
            config.set("LINKER EXTENSION CONFIG", "LDAP Server", "logon10.fed.cclrc.ac.uk")
            self.ldap_server = "logon10.fed.cclrc.ac.uk"
            config.set("LINKER EXTENSION CONFIG", "# specify the dspace url to upload to")
            config.set("LINKER EXTENSION CONFIG", "DSpace URL", "https://epublicns05.esc.rl.ac.uk/")
            self.dspace_url = "https://epublicns05.esc.rl.ac.uk/"

            try:
                with open(config_dir + "/linker_extension_config.ini", "w") as f:
                    config.write(f)
            except:
                print("Error writing config file")
        else:
            linker_config = config["LINKER EXTENSION CONFIG"]

            self.username = linker_config.get("Username", "")

            self.ldap_server = linker_config.get("LDAP Server", "")

            self.dspace_url = linker_config.get("DSpace URL", "")
