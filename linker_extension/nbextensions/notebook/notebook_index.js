var custom_contents = require("../custom_contents.js");
require("../custom_utils.js");
var add_metadata = require("./metadata/add_metadata_dialogue.js");
var associated_data = require("./associated_data.js");
var setup_toolbars = require("./toolbars/setup_toolbars.js");
var modify_notebook_html = require("./modify_notebook_html.js");
require("./upload_data.js");
require("./local_data.js");
require("./upload_notebook.js");
var publish_notebook = require("./publish.js");
var generate_references = require("./toolbars/generate_references.js");
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

    if (!Jupyter.notebook.metadata.hasOwnProperty("reportmetadata") ||
    	Jupyter.notebook.metadata.reportmetadata == undefined) {
    	Jupyter.notebook.metadata.reportmetadata = {};
	}
    
    modify_notebook_html.load();
    add_metadata.load();
    associated_data.load();
    setup_toolbars.load();
    publish_notebook.load();
    generate_references.load();
    download_data.load();

    /*  
     *  Autofilling username config from Jupyterhub
     */ 
    if(window.location.href.indexOf("user") !== -1) { //we're in jupyterhub
        var url_arr = window.location.href.split("/");
        for(var i = 0; i < url_arr.length; i++) {
            if(url_arr[i] === "user") {
                break;
            }
        }
        var fedID = url_arr[i + 1]; //the url part right after user will be the username
        custom_contents.update_config({"username":fedID}).catch(function(reason) {
            //TODO: this rarely ever fails, and it's not catastrophic if it does
            //fail. Should we bother showing the user an error message?
            console.log(reason.message);
        });
    }
}

module.exports = {load_ipython_extension: load_ipython_extension};
