var modify_common_html = require("./modify_common_html.js");
var custom_contents = require("../custom_contents.js");

/*  
 *  entry point for the common section of the extension. This is loaded on all
 *  pages, and so the common html is the html that modifies all pages.
 */ 
function load_ipython_extension(){
    console.log("Linker extension (common) loaded");

    modify_common_html.load();

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
