define(["base/js/namespace","base/js/utils"], function(Jupyter,utils){
    "use strict";

    function load_ipython_extension(){
        console.log("Custom contents loaded");
    }

    var dspace_new_item = function(options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspace"]);
        var settings = {
            type : "POST",
            processData : false,
            contentType: "application/json",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_new_item = function(options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/sword"]);
        var settings = {
            type : "POST",
            processData : false,
            contentType: "application/json",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var upload_data = function(options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/uploadbundle"]);
        var settings = {
            type : "POST",
            processData : false,
            contentType: "application/json",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_get_item = function (options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspacetest"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_delete_item = function (options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspacetest"]);
        var settings = {
            processData : false,
            type : "DELETE",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_get_bitstreams = function (options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspacetest"]);
        var settings = {
            processData : false,
            cache : false,
            type : "PUT",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_get_bitstream_data = function (options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/dspacetest"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
        };
        return utils.promising_ajax(url + "?" + $.param(options), settings);
    };

    var sword_get_servicedocument = function () {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/sword"]);
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
        };
        return utils.promising_ajax(url, settings);
    };

    var ldap_auth = function(options) {
        var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url,
                                                  "/ldap"]);
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            data: options,
            contentType: "application/json",
        };
        return utils.promising_ajax(url, settings);
    };

    module.exports = {
        load_ipython_extension: load_ipython_extension,
        sword_get_servicedocument: sword_get_servicedocument,
        sword_new_item: sword_new_item,
        sword_get_item: sword_get_item,
        sword_get_bitstreams: sword_get_bitstreams,
        sword_delete_item: sword_delete_item,
        dspace_new_item: dspace_new_item,
        upload_data: upload_data,
        sword_get_bitstream_data: sword_get_bitstream_data,
        ldap_auth: ldap_auth,
    };
});
