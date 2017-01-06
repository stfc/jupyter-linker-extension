"""Main extension file. Sets up the url to handler mappings and
specifies the JS extensions."""


from notebook.utils import url_path_join
from notebook.base.handlers import (
    path_regex
)

from linker_extension.handlers.DSpaceHandler import DSpaceHandler
from linker_extension.handlers.SWORDHandler import SWORDHandler
from linker_extension.handlers.TestDSpaceHandlers import (
    FindIDViaMetadata, DeleteItem, GetBitstreams, GetBitstreamData
)
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
        nbapp (NotebookWebApplication): handle to the
        Notebook webserver instance.
    """
    nbapp.log.info("Custom server extension module enabled!")
    web_app = nbapp.web_app
    host_pattern = '.*$'

    # create the route mappings for our handlers
    route_pattern_sword = url_path_join(web_app.settings['base_url'],
                                        '/sword')
    web_app.add_handlers(host_pattern, [(route_pattern_sword, SWORDHandler)])

    route_pattern_uploadbundle = url_path_join(web_app.settings['base_url'],
                                               '/uploadbundle')
    web_app.add_handlers(host_pattern, [(route_pattern_uploadbundle,
                                         UploadBundleHandler)])

    route_pattern_find_id = url_path_join(web_app.settings['base_url'],
                                          '/dspace/findid')
    web_app.add_handlers(host_pattern, [(route_pattern_find_id,
                                         FindIDViaMetadata)])

    route_pattern_delete = url_path_join(web_app.settings['base_url'],
                                         '/dspace/delete')
    web_app.add_handlers(host_pattern, [(route_pattern_delete,
                                         DeleteItem)])

    route_pattern_get_bistreams = url_path_join(web_app.settings['base_url'],
                                                '/dspace/getbistreams')
    web_app.add_handlers(host_pattern, [(route_pattern_get_bistreams,
                                         GetBitstreams)])

    route_pattern_get_bistream_data = url_path_join(web_app.settings['base_url'],
                                              '/dspace/getbistreamdata')
    web_app.add_handlers(host_pattern, [(route_pattern_get_bistream_data,
                                         GetBitstreamData)])

    route_pattern_dspace = url_path_join(web_app.settings['base_url'],
                                         '/dspace')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace, DSpaceHandler)])

    route_pattern_ldap = url_path_join(web_app.settings['base_url'],
                                       '/ldap')
    web_app.add_handlers(host_pattern, [(route_pattern_ldap, LDAPHandler)])

    route_pattern_nbconvert = url_path_join(web_app.settings['base_url'],
                                            r"/nbconvert/%s/%s%s"
                                            % (_format_regex,
                                               _template_regex,
                                               path_regex))
    web_app.add_handlers(host_pattern, [(route_pattern_nbconvert,
                                         CustomNbconvertHandler)])


def _jupyter_server_extension_paths():
    return [{
        "module": "linker_extension"
    }]


# define the sections and paths of our js extensions
def _jupyter_nbextension_paths():
    return [
        dict(
            section="common",
            # the path is relative to the `linker_extension` directory
            src="static/common/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/common/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/common/linker_extension_common"),
        dict(
            section="tree",
            # the path is relative to the `linker_extension` directory
            src="static/tree/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/tree/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/tree/linker_extension_tree"),
        dict(
            section="notebook",
            # the path is relative to the `linker_extension` directory
            src="static/notebook/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/notebook/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/notebook/linker_extension_notebook"),
    ]
