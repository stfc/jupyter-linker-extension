require("es6-promise/auto");
var webpack = require("webpack");

module.exports = {
    //compile main files from files on left. need to include tree-multiselect here
    //since we depend on jQuery, and we don't want to introduce an extra jQuery
    //instance by putting it as a plugin like with es6-promise
    entry: {
        "linker_extension/nbextensions/notebook/linker_extension_notebook": "./linker_extension/nbextensions/notebook/notebook_index.js",
        "linker_extension/nbextensions/common/linker_extension_common": ["ztree/js/jquery.ztree.all.js","./linker_extension/nbextensions/common/common_index.js"]
    },
    //output file
    output: {
        path: "./",
        filename: "[name].js",
        libraryTarget: "amd",
    },

    //export some names
    externals: {
        "base/js/namespace": "base/js/namespace",
        "base/js/utils": "base/js/utils",
        "base/js/dialog": "base/js/dialog",
        "base/js/events": "base/js/events",
        "notebook/js/celltoolbar": "notebook/js/celltoolbar",
    },

    //add es6-promise plugin
    plugins: [
        new webpack.ProvidePlugin({
            "Promise": "es6-promise"
        })
    ]
};
