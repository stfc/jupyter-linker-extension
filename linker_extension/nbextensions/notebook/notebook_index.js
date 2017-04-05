require("../custom_contents.js");
require("../custom_utils.js");
var add_metadata = require("./add_metadata.js");
var custom_cell_toolbar = require("./custom_cell_toolbar.js");
var modify_notebook_html = require("./modify_notebook_html.js");
require("./upload_data.js");
require("./upload_notebook.js");
var publish_notebook = require("./publish_notebook.js");
var generate_references = require("./generate_references.js");
var download_data = require("./download_data.js");

/*  
 *  This is the main entry point that is used by webpack to bundle everything
 *  together. So, we "require" all the modules used by the notebook part of
 *  the extension and run all their load functions when the extension loads.
 */ 

function load_ipython_extension(){
    console.log("Linker extension (notebook) loaded");

    //on load, set the first cell to be markdown and indicate to the user
    //that it is an abstract cell and will be used as the abstract
    //in eData. Only do this the cell is empty
    if(Jupyter.notebook.get_cell(0).get_text() === "") {
        Jupyter.notebook.get_cell(0).cell_type = "markdown";
        Jupyter.notebook.cells_to_markdown();
        Jupyter.notebook.get_cell(0).set_text("The first cell of the notebook " + 
            "is used as the abstract for the notebook. Please enter your " + 
            "abstract here. If you accidentally delete this cell, please " + 
            "just create a new markdown cell at the top of the notebook.");
        Jupyter.notebook.get_cell(0).execute();
    }    

    modify_notebook_html.load();
    add_metadata.load();
    custom_cell_toolbar.load();
    publish_notebook.load();
    generate_references.load();
    download_data.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
