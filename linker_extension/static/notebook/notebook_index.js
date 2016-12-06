var custom_contents = require("../custom_contents.js");
var custom_utils = require("../custom_utils.js");
var add_metadata = require("./add_metadata.js");
var custom_cell_toolbar = require("./custom_cell_toolbar.js");
var modify_notebook_html = require("./modify_notebook_html.js");
var select_data_notebook = require("./select_data_notebook.js");
var upload_data = require("./upload_data.js");
var upload_notebook = require("./upload_notebook.js");
var view_data_dialog = require("./view_data_dialog.js");

function load_ipython_extension(){
    console.log('Linker extension (notebook) loaded');

    modify_notebook_html.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
