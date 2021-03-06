var modify_common_html = require("./modify_common_html.js");

/*  
 *  entry point for the common section of the extension. This is loaded on all
 *  pages, and so the common html is the html that modifies all pages.
 */ 
function load_ipython_extension(){
    console.log("Linker extension (common) loaded");

    modify_common_html.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
