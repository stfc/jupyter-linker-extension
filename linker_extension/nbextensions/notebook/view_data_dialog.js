define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/utils",
    "./modify_notebook_html",
    "./select_data_notebook",
],function(Jupyter,dialog,utils,select_data){
    
    /*  
     *  Generates the modal dialog that displays the selected data files
     *  generated from view_data
     */ 
    var view_data_dialog = function () {
        var dialog_body = $("<div/>").append(
            $("<p/>").addClass("bundle-message")
                .text("These are the files currently associated with " + 
                      Jupyter.notebook.notebook_name + " :")
        ).append(
            $("<br/>")
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

    /*  
     *  Displays selected data. Generates divs that visualise the data files 
     *  selected, plus a button that allows them to change the selected data
     *  and it displays a notification/attention thingy if they have already
     *  published their data. Returns the div that contains all the fields
     *  for the dialog and also returns the file paths, names and types of
     *  the selected files to be used when doing data upload.
     */ 
    var view_data = function() {
        var view_data_div = $("<div/>").attr("id","view_data_container");
        var file_names = [];
        var file_paths = [];
        var file_types = [];

        var select_data_button = $("<button/>")
            .addClass("btn btn-xs btn-default select-data-button")
            .attr("type","button")
            .text("Select data")
            .attr("title","Select data to associate with this notebook")
            .attr("aria-label","Select data to associate with this notebook")
            .click(function() {
                select_data.select_data();
            });

        var associated_files = $("<div/>").attr("id","associated-files");

        if(!($.isEmptyObject(Jupyter.notebook.metadata))) {
            if("databundle" in Jupyter.notebook.metadata) {
                var databundle = Jupyter.notebook.metadata.databundle;
                var type_order = {"directory":0,"notebook":1,"file":2};
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
                    var div = $("<div/>")
                        .text(item.path)
                        .attr("data-indent",0)
                        .attr("class","bundle-item")
                        .css("margin-left","0px");

                    if(item.type === "directory") {
                        divs[item.path] = div;
                    }
                    if(divs.hasOwnProperty(utils.url_path_split(item.path)[0])){
                        var parent = utils.url_path_split(item.path)[0];
                        var indent = divs[parent].attr("data-indent") + 1;

                        div.text(item.name)
                           .attr("data-indent",indent)
                           .css("margin-left","12px");

                        divs[parent].append(div);
                    } else {
                        associated_files.append(div);
                    }
                    file_names.push(item.name);
                    file_paths.push(item.path);
                    file_types.push(item.type);
                });
                view_data_div.append(associated_files);
            } else {
                view_data_div.append(associated_files
                                     .text("You have associated no files " + 
                                           "with this notebook!"));
            }
            if("databundle_url" in Jupyter.notebook.metadata) {
                var exists_warning = $("<div/>").attr("id","exists-warning");
                exists_warning.append($("<strong/>")
                                     .text("ATTENTION: ")
                                     .css("color","red"));
                exists_warning.append($("<p/>")
                                     .text("You have already uploaded the " + 
                                           "associated data for this notebook. " +
                                           "It is located here: "));
                exists_warning.append($("<a/>")
                                     .attr("href",Jupyter.notebook.metadata.databundle_url)
                                     .text(Jupyter.notebook.metadata.databundle_url));
                view_data_div.append(exists_warning);
            }
        } else {
            view_data_div.append(associated_files
                                 .text("You have associated no files" + 
                                       "with this notebook!"));
        }
        view_data_div.append($("<br/>"));
        associated_files.after(select_data_button);

        return {view_data_div: view_data_div,
                file_names: file_names,
                file_paths: file_paths,
                file_types: file_types};
    };
    
    //actions, buttons and exports...

    var action = {
        help: "View associated data",
        help_index: "c",
        icon: "fa-eye",
        handler : view_data,
    };

    var prefix = "linker_extension";
    var action_name = "view-associated-data";
    
    var load = function () {
        Jupyter.actions.register(action,action_name,prefix);
        $("#view_data").click(function () {
            view_data_dialog();
        });
    };

    module.exports = {load: load, view_data: view_data};
});