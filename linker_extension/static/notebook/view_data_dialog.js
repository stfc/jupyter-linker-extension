define(['base/js/namespace','base/js/dialog','base/js/utils','./modify_notebook_html'],function(Jupyter,dialog,utils){
    
    var view_data = function () {
        var dialog_body = $('<div/>').append(
            $('<p/>').addClass("bundle-message")
                .text('These are the files currently associated with ' + Jupyter.notebook.notebook_name + " :")
        ).append(
            $('<br/>')
        );
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
                });
                dialog_body.append(bundlehtml);
            } else {
            dialog_body.append($('<div/>').text("You have associated no files with this notebook!"));
            }
        } else {
            dialog_body.append($('<div/>').text("You have associated no files with this notebook!"));
        }

        var d = dialog.modal({
            title : "View Associated Data",
            body : dialog_body,
            default_button: "OK",
            buttons : {
                OK: {}
            },
        });
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
            view_data();
        });
    };

    module.exports = {load: load};
});