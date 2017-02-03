var webpack = require("webpack");

module.exports = {
    entry: {
        "linker_extension/static/tree/linker_extension_tree": "./linker_extension/static/tree/tree_index.js",
        "linker_extension/static/notebook/linker_extension_notebook": "./linker_extension/static/notebook/notebook_index.js",
        "linker_extension/static/common/linker_extension_common": ["es6-promise/auto","./linker_extension/static/common/common_index.js"],

    },
    output: {
        path: "./",
        filename: "[name].js",
        libraryTarget: "amd",
    },

    externals: {
        "base/js/namespace": "base/js/namespace",
        "base/js/utils": "base/js/utils",
        "base/js/dialog": "base/js/dialog",
        "base/js/events": "base/js/events",
        "notebook/js/celltoolbar": "notebook/js/celltoolbar",
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({minimize: true,sourceMap: true})
    ]
};
