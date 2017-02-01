define(["base/js/namespace","base/js/utils"], function(Jupyter,utils){
    "use strict";

    /*  
     *  This file declares some extra request makers, just like in 
     *  base/js/contents.js They make a request to our python handlers
     *  with some data in their body and return a Promise that resolves
     *  once the request is finished.
     */ 

    //get the DSpace collections. Used by add_metadata to populate the repository
    //dropdown
    var get_collections = function() {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace"]);
        var settings = {
            type : "GET",
            processData : false,
            cache : false,
        };
        return utils.promising_ajax(url, settings);
    };

    //used to upload a notebook
    var sword_new_item = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/sword"]);
        var settings = {
            type : "POST",
            cache: false,
            processData : false,
            data: data,
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //used to upload some data
    var upload_data = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/uploadbundle"]);
        var settings = {
            type : "POST",
            processData : false,
            data: data,
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //not used anymore but used to be used instead of get_collections
    var sword_get_servicedocument = function() {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/sword"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
        };
        return utils.promising_ajax(url, settings);
    };

    //authenticates a user with the ldap server
    var ldap_auth = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/ldap"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            data: data,
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //export them so we can use the functions
    module.exports = {
        sword_get_servicedocument: sword_get_servicedocument,
        get_collections: get_collections,
        sword_new_item: sword_new_item,
        upload_data: upload_data,
        ldap_auth: ldap_auth,
    };
});
