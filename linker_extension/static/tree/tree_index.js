require("../custom_contents.js");
require("../custom_utils.js");
var modify_tree_html = require("./modify_tree_html.js");
var select_data_tree = require("./select_data_tree.js");


/*  
 *  main entry point for the tree part of the extension
 */ 
function load_ipython_extension(){
    console.log("Linker extension (tree) loaded");

    modify_tree_html.load();
    select_data_tree.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
