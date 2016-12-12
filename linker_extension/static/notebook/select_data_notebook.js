define(['base/js/namespace','base/js/utils','base/js/dialog','./modify_notebook_html'],function(Jupyter,utils,dialog){
    
    var select_data = function () {
        var parameters = {
            "bundle": Jupyter.notebook.notebook_path
        };
        sessionStorage.setItem("bundle",Jupyter.notebook.notebook_path);

        var parent = utils.url_path_split(Jupyter.notebook.notebook_path)[0];
        window.open(utils.url_path_join(Jupyter.notebook.contents.base_url, 'tree',utils.encode_uri_components(parent)),"_self");
    };

    

    var action = {
        help: 'Select associated data',
        help_index: 'd',
        icon: 'fa-check-square-o',
        handler : select_data,
    };

    var prefix = "linker_extension";
    var action_name = "select-associated-data";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);

    var load = function () {
        $('#select_data').click(function() {
            select_data();
        });
    };

    module.exports = {load: load, select_data: select_data};

});