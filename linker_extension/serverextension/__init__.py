"""
Main server extension file. Defines the url to handler mappings
"""

from notebook.utils import url_path_join
from notebook.base.handlers import (
    path_regex
)

from .ConfigHandler import LinkerExtensionConfig, ConfigHandler
from .DSpaceHandler import DSpaceHandler
from .SWORDHandler import SWORDHandler
from .TestDSpaceHandlers import (
    FindIDViaMetadata, DeleteItem, GetBitstreams, GetBitstreamData, ListAllItems
)
from .UploadBundleHandler import UploadBundleHandler
from .UploadBundleAlternateHandler import UploadBundleAlternateHandler
from .UploadBundleAlternateHandler2 import UploadBundleAlternateHandler2
from .LDAPHandler import LDAPHandler
from .CustomNbconvertHandler import CustomNbconvertHandler
from .DownloadHandler import DownloadHandler
from .MiscHandlers import ContentsHandler

# ----------------------------------------------------------------------------
# URL to handler mappings
# ----------------------------------------------------------------------------

_format_regex = r"(?P<format>\w+)"

_template_regex = r"/(?P<template_file>\w+)"


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

    route_pattern_uploadbundlealternate = url_path_join(web_app.settings['base_url'],
                                               '/uploadbundle_alternate')
    web_app.add_handlers(host_pattern, [(route_pattern_uploadbundlealternate,
                                         UploadBundleAlternateHandler)])

    route_pattern_uploadbundlealternate2 = url_path_join(web_app.settings['base_url'],
                                               '/uploadbundle_alternate2')
    web_app.add_handlers(host_pattern, [(route_pattern_uploadbundlealternate2,
                                         UploadBundleAlternateHandler2)])

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

    route_pattern_find_id = url_path_join(web_app.settings['base_url'],
                                          '/dspace/listitems')
    web_app.add_handlers(host_pattern, [(route_pattern_find_id,
                                         ListAllItems)])

    route_pattern_dspace = url_path_join(web_app.settings['base_url'],
                                         '/dspace')
    web_app.add_handlers(host_pattern, [(route_pattern_dspace, DSpaceHandler)])

    route_pattern_ldap = url_path_join(web_app.settings['base_url'],
                                       '/ldap')
    web_app.add_handlers(host_pattern, [(route_pattern_ldap, LDAPHandler)])

    route_pattern_config = url_path_join(web_app.settings['base_url'],
                                       '/linker_config')
    web_app.add_handlers(host_pattern, [(route_pattern_config, ConfigHandler)])

    route_pattern_download = url_path_join(web_app.settings['base_url'],
                                       '/dspace_download')
    web_app.add_handlers(host_pattern, [(route_pattern_download, DownloadHandler)])

    route_pattern_contents = url_path_join(web_app.settings['base_url'],
                                       '/dspace_contents')
    web_app.add_handlers(host_pattern, [(route_pattern_contents, ContentsHandler)])

    route_pattern_nbconvert = url_path_join(web_app.settings['base_url'],
                                            r"/customnbconvert/%s%s%s"
                                            % (_format_regex,
                                               _template_regex,
                                               path_regex))
    web_app.add_handlers(host_pattern, [(route_pattern_nbconvert,
                                         CustomNbconvertHandler)])
