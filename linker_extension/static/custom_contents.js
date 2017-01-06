define(["base/js/namespace","base/js/utils"], function(Jupyter,utils){
    "use strict";

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

    module.exports = {
        sword_get_servicedocument: sword_get_servicedocument,
        get_collections: get_collections,
        sword_new_item: sword_new_item,
        upload_data: upload_data,
        ldap_auth: ldap_auth,
    };
});
