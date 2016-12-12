"""Main extension file. Sets up the url to handler mappings and specifies the JS extensions."""


from notebook.utils import url_path_join
from notebook.base.handlers import (
    path_regex
)

from linker_extension.handlers.DSpaceHandler import DSpaceHandler
from linker_extension.handlers.SWORDHandler import SWORDHandler
from linker_extension.handlers.TestDSpaceHandler import TestDSpaceHandler
from linker_extension.handlers.UploadBundleHandler import UploadBundleHandler
from linker_extension.handlers.LDAPHandler import LDAPHandler
from linker_extension.handlers.CustomNbconvertHandler import CustomNbconvertHandler


# ----------------------------------------------------------------------------
# URL to handler mappings
# ----------------------------------------------------------------------------

_format_regex = r"(?P<format>\w+)"

_template_regex = r"(?P<template_file>\w+)"


def load_jupyter_server_extension(nbapp):
    """
    Called when the extension is loaded.

    Args:
        nbapp (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    nbapp.log.info("Custom server extension module enabled!")
    web_app = nbapp.web_app
    host_pattern = '.*$'
    route_pattern_dspace = url_path_join(web_app.settings['base_url'], '/dspace')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace, DSpaceHandler)])
    route_pattern_sword = url_path_join(web_app.settings['base_url'], '/sword')
    web_app.add_handlers(host_pattern, [(route_pattern_sword, SWORDHandler)])
    route_pattern_uploadbundle = url_path_join(web_app.settings['base_url'], '/uploadbundle')
    web_app.add_handlers(host_pattern, [(route_pattern_uploadbundle, UploadBundleHandler)])
    route_pattern_dspace_test = url_path_join(web_app.settings['base_url'], '/dspacetest')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace_test, TestDSpaceHandler)])
    route_pattern_ldap = url_path_join(web_app.settings['base_url'], '/ldap')
    web_app.add_handlers(host_pattern, [(route_pattern_ldap, LDAPHandler)])
    route_pattern_nbconvert = url_path_join(web_app.settings['base_url'], r"/nbconvert/%s/%s%s" % (_format_regex, _template_regex, path_regex))
    web_app.add_handlers(host_pattern, [(route_pattern_nbconvert, CustomNbconvertHandler)])


def _jupyter_server_extension_paths():
    return [{
        "module": "linker_extension"
    }]


def _jupyter_nbextension_paths():
    return [
        dict(
            section="tree",
            # the path is relative to the `my_fancy_module` directory
            src="static/tree/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/tree/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/tree/linker_extension_tree"),
        dict(
            section="notebook",
            # the path is relative to the `my_fancy_module` directory
            src="static/notebook/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/notebook/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/notebook/linker_extension_notebook"),
    ]
