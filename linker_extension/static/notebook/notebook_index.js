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
    add_metadata.load();
    select_data_notebook.load();
    upload_data.load();
    upload_notebook.load();
    view_data_dialog.load();
    custom_cell_toolbar.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
