define(['base/js/namespace','base/js/dialog','base/js/utils','./modify_notebook_html'],function(Jupyter,dialog,utils){
    
    var view_data_dialog = function () {
        var dialog_body = $('<div/>').append(
            $('<p/>').addClass("bundle-message")
                .text('These are the files currently associated with ' + Jupyter.notebook.notebook_name + " :")
        ).append(
            $('<br/>')
        ).append(
            view_data().view_data_div
        );

        var d = dialog.modal({
            title : "View Associated Data",
            body : dialog_body,
            default_button: "OK",
            buttons : {
                OK: {}
            },
        });
    };

    var view_data = function() {
        var view_data_div = $("<div/>").attr("id","view_data_container");
        var file_names = [];
        var file_paths = [];
        var file_types = [];

        if(!($.isEmptyObject(Jupyter.notebook.metadata))) {
            if("databundle" in Jupyter.notebook.metadata) {
                var databundle = Jupyter.notebook.metadata.databundle;
                var bundlehtml = $('<div/>');
                var type_order = {'directory':0,'notebook':1,'file':2};
                var db_copy = databundle.slice();
                db_copy.sort(function(a,b) {
                    if (type_order[a.type] < type_order[b.type]) {
                        return -1;
                    }
                    if (type_order[a.type] > type_order[b.type]) {
                        return 1;
                    }
                    if (a.path.toLowerCase() < b.path.toLowerCase()) {
                        return -1;
                    }
                    if (a.path.toLowerCase() > b.path.toLowerCase()) {
                        return 1;
                    }
                    return 0;
                });
                var divs = {};
                db_copy.forEach(function(item) {
                    var div = $('<div/>').text(item.path).attr('data-indent',0).attr('class','bundle-item').css("margin-left","0px");
                    if(item.type === 'directory') {
                        divs[item.path] = div;
                    }
                    if(divs.hasOwnProperty(utils.url_path_split(item.path)[0])) {
                        var parent = utils.url_path_split(item.path)[0];
                        var indent = divs[parent].attr('data-indent') + 1;
                        div.text(item.name).attr('data-indent',indent).css("margin-left","12px");
                        divs[parent].append(div);
                    } else {
                        bundlehtml.append(div);
                    }
                    file_names.push(item.name);
                    file_paths.push(item.path);
                    file_types.push(item.type);
                });
                view_data_div.append(bundlehtml);
            } else {
                view_data_div.append($('<div/>').text("You have associated no files with this notebook!"));
            }
            if("databundle_url" in Jupyter.notebook.metadata) {
                view_data_div.append($("<br/>"));
                view_data_div.append($('<strong/>').text("ATTENTION: ").css("color","red"));
                view_data_div.append($('<p/>').text("You have already uploaded the associated data for this notebook. It is located here: "));
                view_data_div.append($("<a/>").attr("href",Jupyter.notebook.metadata.databundle_url).text(Jupyter.notebook.metadata.databundle_url));
            }
        } else {
            view_data_div.append($('<div/>').text("You have associated no files with this notebook!"));
        }
        return {view_data_div: view_data_div, file_names: file_names, file_paths: file_paths, file_types: file_types};
    };
    
    var action = {
        help: 'View associated data',
        help_index: 'c',
        icon: 'fa-eye',
        handler : view_data,
    };

    var prefix = "linker_extension";
    var action_name = "view-associated-data";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);
    
    var load = function () {
        $('#view_data').click(function () {
            view_data_dialog();
        });
    };

    module.exports = {load: load, view_data: view_data};
});