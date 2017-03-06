"""
Main extension file. Specifies the server extension and the the JS extensions
"""


def _jupyter_server_extension_paths():
    return [
        dict(module="linker_extension.serverextension")
    ]


def _jupyter_bundlerextension_paths():
    """Example "hello world" bundler extension"""
    return [{
        'name': 'linker_bundler',                    # unique bundler name
        'label': '(Linker) PDF with references via LaTeX (.pdf)',                   # human-redable menu item label
        'module_name': 'linker_extension.bundlerextension',   # module containing bundle()
        'group': 'download'                           # group under 'deploy' or 'download' menu
    }]


# define the sections and paths of our js extensions
def _jupyter_nbextension_paths():
    return [
        dict(
            section="common",
            # the path is relative to the `linker_extension` directory
            src="nbextensions/common/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/common/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/common/linker_extension_common"),
        dict(
            section="tree",
            # the path is relative to the `linker_extension` directory
            src="nbextensions/tree/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/tree/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/tree/linker_extension_tree"),
        dict(
            section="notebook",
            # the path is relative to the `linker_extension` directory
            src="nbextensions/notebook/",
            # directory in the `nbextension/` namespace
            dest="linker_extension/notebook/",
            # _also_ in the `nbextension/` namespace
            require="linker_extension/notebook/linker_extension_notebook"),
    ]
