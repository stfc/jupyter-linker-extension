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
    var get_collections = function(community) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace"]);
        var settings = {
            type : "GET",
            processData : false,
            cache : false,
        };
        if(community) {
            return utils.promising_ajax(url + "?" + $.param(community), settings);
        } else {
            return utils.promising_ajax(url, settings);
        }
    };

    //used to upload a notebook
    var sword_new_item = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/sword"]);
        var settings = {
            type : "POST",
            cache: false,
            processData : false,
            data: JSON.stringify(data),
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
            data: JSON.stringify(data),
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
            data: JSON.stringify(data),
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //authenticates a user with the ldap server
    var ldap_search = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/ldap"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
        };
        return utils.promising_ajax(url + "?" + $.param(data), settings);
    };

    //updates the config file with user defined options during a notebook session
    var update_config = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/linker_config"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //retrieves data stored in the config file
    var get_config = function() {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/linker_config"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
        };
        return utils.promising_ajax(url, settings);
    };
    
    //downloads data from dspace. 
    var download_data = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace_download"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //redownloads data from dspace. 
    var redownload_data = function(data) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace_redownload"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    //returns the base path for the server. 
    var get_server_path = function() {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace_contents"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
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
        ldap_search: ldap_search,
        update_config: update_config,
        get_config: get_config,
        download_data: download_data,
        redownload_data: redownload_data,
        get_server_path: get_server_path,
    };
});
