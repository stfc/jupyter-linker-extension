casper.dspace_new_item = function(options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/dspace']);
    var settings = {
        type : "POST",
        processData : false,
        contentType: 'application/json',
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.sword_new_item = function(options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/sword']);
    var settings = {
        type : "POST",
        processData : false,
        contentType: 'application/json',
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.upload_data = function(options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/uploadbundle']);
    var settings = {
        type : "POST",
        processData : false,
        contentType: 'application/json',
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.sword_get_item = function (options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/dspacetest']);
    var settings = {
        processData : false,
        cache : false,
        type : "GET",
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

var sword_delete_item = function (options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/dspacetest']);
    var settings = {
        processData : false,
        type : "DELETE",
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.sword_get_bitstreams = function (options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/dspacetest']);
    var settings = {
        processData : false,
        cache : false,
        type : "PUT",
        dataType : "json",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.sword_get_bitstream_data = function (options) {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/dspacetest']);
    var settings = {
        processData : false,
        cache : false,
        type : "POST",
    };
    return utils.promising_ajax(url + '?' + $.param(options), settings);
};

casper.sword_get_servicedocument = function () {
    var url = utils.url_path_join.apply(null,[Jupyter.notebook.base_url, '/sword']);
    var settings = {
        processData : false,
        cache : false,
        type : "GET",
        dataType : "json",
    };
    return utils.promising_ajax(url, settings);
};
