require("../custom_contents.js");
require("../custom_utils.js");
var add_metadata = require("./add_metadata.js");
var custom_cell_toolbar = require("./custom_cell_toolbar.js");
var modify_notebook_html = require("./modify_notebook_html.js");
var select_data_notebook = require("./select_data_notebook.js");
require("./upload_data.js");
require("./upload_notebook.js");
var view_data_dialog = require("./view_data_dialog.js");
var publish_notebook = require("./publish_notebook.js");
var generate_references = require("./generate_references.js");

/*  
 *  This is the main entry point that is used by webpack to bundle everything
 *  together. So, we "require" all the modules used by the notebook part of
 *  the extension and run all their load functions when the extension loads.
 */ 

function load_ipython_extension(){
    console.log("Linker extension (notebook) loaded");

    modify_notebook_html.load();
    add_metadata.load();
    select_data_notebook.load();
    view_data_dialog.load();
    custom_cell_toolbar.load();
    publish_notebook.load();
    generate_references.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
