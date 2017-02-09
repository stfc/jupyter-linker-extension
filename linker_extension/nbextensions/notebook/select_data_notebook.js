define([
    "base/js/namespace",
    "base/js/utils",
    "./modify_notebook_html"
],function(Jupyter,utils){
    
    /*  
     *  Add the notebook_path to the session storage so we can access it when
     *  we're on the tree page. Then redirect to the tree page so they can
     *  start selecting data
     */ 
    var select_data = function () {
        sessionStorage.setItem("bundle",Jupyter.notebook.notebook_path);

        var parent = utils.url_path_split(Jupyter.notebook.notebook_path)[0];
        window.open(utils.url_path_join(Jupyter.notebook.contents.base_url,
                                        "tree",
                                        utils.encode_uri_components(parent)),
                    "_self");
    };

    
    //register actions and set up button
    var action = {
        help: "Select associated data",
        help_index: "d",
        icon: "fa-check-square-o",
        handler : select_data,
    };

    var prefix = "linker_extension";
    var action_name = "select-associated-data";

    var load = function () {
        Jupyter.actions.register(action,action_name,prefix);
        $("#select_data").click(function() {
            select_data();
        });
    };

    module.exports = {load: load, select_data: select_data};

});