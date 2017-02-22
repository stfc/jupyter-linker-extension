define([
    "base/js/namespace",
    "base/js/events",
    "base/js/dialog",
    "base/js/utils",
    "./modify_tree_html",
], function(Jupyter,events,dialog,utils) {

    "use strict";

    //the referring notebook is the ntoebook that we are associating data with
    var referring_notebook = "";

    //this is used so that we can tell if a page is newly loaded or if it has been
    //modified in some other way (aka refresh)
    var page_loaded;

    var load = function(){
        Jupyter.notebook_list.load_list();
        if (sessionStorage.getItem("bundle")) {
            referring_notebook = sessionStorage.getItem("bundle");
        }
        page_loaded = true;

        //this is so the test knows when we've loaded
        $(document.body).append($("<div>").attr("id","tree_extension_loaded"));

        //remove immediately after to not clutter up the DOM
        $("tree_extension_loaded").remove();

        //associate the relevant functions with the bundle and cancel buttons
        $(".bundle-button").click(
            $.proxy(Jupyter.NotebookList.prototype.bundle_selected, 
                    Jupyter.notebook_list)
        );

        //remove notebook path from seession sotrage and redirect back to notebook
        $(".bundle-cancel-button").click(function() {
            sessionStorage.removeItem("bundle");
            var nb_url = utils.url_path_join(
                utils.get_body_data("baseUrl"),
                "notebooks",
                referring_notebook
            );
            window.location.assign(nb_url);
        });
    };

    

    /*  
     *  this is copied from NotebookList, used here so I can add functionality
     *  via draw_notebook_list as a wrapper function
     */ 
    var type_order = {"directory":0,"notebook":1,"file":2};

    Jupyter.NotebookList.prototype.draw_notebook_list_2 = function(
        list,
        error_msg,
        selected_before)
    {
        list.content.sort(function(a, b) {
            if (type_order[a["type"]] < type_order[b["type"]]) {
                return -1;
            }
            if (type_order[a["type"]] > type_order[b["type"]]) {
                return 1;
            }
            if (a["name"].toLowerCase() < b["name"].toLowerCase()) {
                return -1;
            }
            if (a["name"].toLowerCase() > b["name"].toLowerCase()) {
                return 1;
            }
            return 0;
        });
        var message = error_msg || "Notebook list empty.";
        var item = null;
        var model = null;
        var len = list.content.length;
        this.clear_list();
        var n_uploads = this.element.children(".list_item").length;
        if (len === 0) {
            item = this.new_item(0);
            var span12 = item.children().first();
            span12.empty();
            span12.append($("<div/>")
                          .css("margin","auto")
                          .css("text-align","center")
                          .css("color","grey")
                          .text(message));
        }
        var path = this.notebook_path;
        var offset = n_uploads;
        if (path !== "") {
            item = this.new_item(offset, false);
            model = {
                type: "directory",
                name: "..",
                path: utils.url_path_split(path)[0]
            };
            this.add_link(model, item);
            offset += 1;
        }
        for (var i=0; i<len; i++) {
            model = list.content[i];
            item = this.new_item(i+offset, true);
            try {
                this.add_link(model, item);
            } catch(err) {
                console.log("Error adding link: " + err);
            }
        }
        // Trigger an event when we've finished drawing the notebook list.
        events.trigger("draw_notebook_list.NotebookList");

        // Reselect the items that were selected before.  Notify listeners
        // that the selected items may have changed.  O(n^2) operation.
        selected_before.forEach(function(item) {
            var list_items = $(".list_item");
            for (var i=0; i<list_items.length; i++) {
                var $list_item = $(list_items[i]);
                if ($list_item.data("path") === item.path) {
                    $list_item.find("input[type=checkbox]")
                              .prop("checked", true);
                    break;
                }
            }
        });
        this._selection_changed();    
    };


    /*  
     *  tells draw_notebook_list_2 what boxes to have selected. This is so that
     *  if a user already had some data associated, when they select some more
     *  the checkboxes for the prexisting associated files are ticked.
     */ 
    Jupyter.NotebookList.prototype.draw_notebook_list = function (list, error_msg) {
        var that = this;
        // Remember what was selected before the refresh.
        var selected_before = [];
        if(referring_notebook && page_loaded) {
            //we need this as we only want to fill in the tickboxes from the
            //ones stored in the metadata on initial page load.
            //If we soft refresh we want to keep the original selected_before
            //functionality
            page_loaded = false;
            var nb = null;
            //get the notebook metadata so we can get the previously associated
            //files
            that.contents.get(referring_notebook,{type: "notebook"})
                .then(function(model) {
                    nb = model;
                    if (nb.content.hasOwnProperty("metadata") && 
                       nb.content.metadata.hasOwnProperty("databundle"))
                    {
                        var db = nb.content.metadata.databundle;
                        db.forEach(function(item) {
                            selected_before.push({
                                name: item.name,
                                path: item.path,
                                type: item.type
                            });
                        });
                    }
                    that.draw_notebook_list_2(list,error_msg,selected_before);
                }
            );
        } else {
            selected_before = this.selected;
            this.draw_notebook_list_2(list,error_msg,selected_before);
        }
    };

    /*  
     *  copied from NotebookList. adds a "has notebook" flag as we set it so
     *  you can't associate a notebook with another notebook TODO: is this
     *  to harsh? and add logic to shwoing and hiding the regular buttons
     *  and our custom bundle buttons
     */ 
    Jupyter.NotebookList.prototype._selection_changed = function() {
        // Use a JQuery selector to find each row with a checked checkbox.  If
        // we decide to add more checkboxes in the future, this code will need
        // to be changed to distinguish which checkbox is the row selector.
        var selected = [];
        var has_running_notebook = false;
        var has_directory = false;
        var has_file = false;
        var has_notebook = false;
        var that = this;
        var checked = 0;
        $(".list_item :checked").each(function(index, item) {
            var parent = $(item).parent().parent();

            // If the item doesn't have an upload button, isn't the breadcrumbs
            // and isn't the parent folder "..", then it can be selected.
            // Breadcrumbs path == "".
            if (parent.find(".upload_button").length === 0 &&
                parent.data("path") !== "" &&
                parent.data("path") !== utils.url_path_split(that.notebook_path)[0])
            {
                checked++;
                selected.push({
                    name: parent.data("name"),
                    path: parent.data("path"),
                    type: parent.data("type")
                });

                // Set flags according to what is selected.  Flags are later
                // used to decide which action buttons are visible.
                has_running_notebook = has_running_notebook ||
                    (parent.data("type") === "notebook" &&
                     that.sessions[parent.data("path")] !== undefined);

                has_notebook = has_notebook ||
                               (parent.data("type") === "notebook");

                has_file = has_file ||
                           (parent.data("type") === "file");

                has_directory = has_directory || 
                                (parent.data("type") === "directory");
            }
        });
        this.selected = selected;

        // Rename is only visible when one item is selected,
        //and it is not a running notebook
        if (selected.length === 1 &&
            !has_running_notebook &&
            !(referring_notebook))
        {
            $(".rename-button").css("display", "inline-block");
        } else {
            $(".rename-button").css("display", "none");
        }

        // Move is visible iff at least one item is selected, and none of them
        // are a running notebook.
        if (selected.length >= 1 &&
            !has_running_notebook &&
            !(referring_notebook)) {
            $(".move-button").css("display", "inline-block");
        } else {
            $(".move-button").css("display", "none");
        }

        // Download is only visible when one item is selected, and it is not a
        // running notebook or a directory
        // TODO(nhdaly): Add support for download multiple items at once.
        if (selected.length === 1 &&
            !has_running_notebook &&
            !has_directory &&
            !(referring_notebook))
        {
            $(".download-button").css("display", "inline-block");
        } else {
            $(".download-button").css("display", "none");
        }

        // Shutdown is only visible when one or more notebooks running notebooks
        // are selected and no non-notebook items are selected.
        if (has_running_notebook &&
            !(has_file || has_directory) &&
            !(referring_notebook))
        {
            $(".shutdown-button").css("display", "inline-block");
        } else {
            $(".shutdown-button").css("display", "none");
        }

        // Duplicate isn't visible when a directory is selected.
        if (selected.length > 0 &&
            !has_directory &&
            !(referring_notebook))
        {
            $(".duplicate-button").css("display", "inline-block");
        } else {
            $(".duplicate-button").css("display", "none");
        }

        // Delete is visible if one or more items are selected.
        if (selected.length > 0 && !(referring_notebook)) {
            $(".delete-button").css("display", "inline-block");
        } else {
            $(".delete-button").css("display", "none");
        }

        // Bundle is visible if one or more items are selected
        //but not when there's a notebook.
        if (!has_notebook && referring_notebook) {
            $(".bundle-button").css("display", "inline-block");
            $(".bundle-button").attr("disabled",false);            
        } else if (referring_notebook) {
            $(".bundle-button").css("display", "inline-block");
            $(".bundle-button").attr("disabled",true);
        } else {
            $(".bundle-button").css("display", "none");
        }

        if (referring_notebook) {
            $(".bundle-cancel-button").css("display", "inline-block");
        } else {
            $(".bundle-cancel-button").css("display", "none");
        }
        // If all of the items are selected, show the selector as checked.  If
        // some of the items are selected, show it as checked.  Otherwise,
        // uncheck it.
        var total = 0;
        $(".list_item input[type=checkbox]").each(function(index, item) {
            var parent = $(item).parent().parent();
            // If the item doesn't have an upload button and it's not the
            // breadcrumbs, it can be selected.  Breadcrumbs path == "".
            if (parent.find(".upload_button").length === 0 &&
                parent.data("path") !== "" &&
                parent.data("path") !== utils.url_path_split(that.notebook_path)[0])
            {
                total++;
            }
        });

        var select_all = $("#select-all");
        if (checked === 0) {
            select_all.prop("checked", false);
            select_all.prop("indeterminate", false);
            select_all.data("indeterminate", false);
        } else if (checked === total) {
            select_all.prop("checked", true);
            select_all.prop("indeterminate", false);
            select_all.data("indeterminate", false);
        } else {
            select_all.prop("checked", false);
            select_all.prop("indeterminate", true);
            select_all.data("indeterminate", true);
        }
        // Update total counter
        $("#counter-select-all").html(checked===0 ? "&nbsp;" : checked);

        // If at aleast on item is selected (or if in data association mode),
        // hide the selection instructions.
        if (checked > 0 || referring_notebook) {
            $(".dynamic-instructions").css("display","none");
        } else {
            $(".dynamic-instructions").css("display","inline-block");
        }
        if (referring_notebook) {
            $(".bundle-instructions").css("display","inline-block");
            $("#bundle-divider").css("display","block");
        } else {
            $(".bundle-instructions").css("display","none");
            $("#bundle-divider").css("display","none");          
        }
    };

    /*  
     *  bundle the files that have been selected with a notebook. It generates
     *  a popup that lists the files asking for confirmation. If confirmed, it
     *  saves the bundle to notebook metadata and redirects back to the notebook
     */ 
    Jupyter.NotebookList.prototype.bundle_selected = function() {
        var that = this;
        var data_bundle = [];
        var nb = null;
        //check to see that we're actually bundling something
        //and not here accidentally
        if(referring_notebook) { 
            //get our notebook
            that.contents.get(referring_notebook, {type: "notebook"})
                         .then(function(model) { nb = model; });

            var dialog_body = $("<div/>").append(
                $("<p/>").addClass("bundle-message")
                    .text("Confirm that you wish to associate these files with "
                          + referring_notebook + " :")).append($("<br/>"));
            
            /*  
             *  for each item that is seleted, create a div with it's name and
             *  append it to the dialog body. if a file is a directory, we have
             *  to search for it's subdirectories and files too. 
             */ 
            that.selected.forEach(function(curr) {
                var namehtml = $("<div/>").text(curr.path)
                               .attr("class","bundled-file")
                               .attr("id",curr.path)
                               .css("margin-left","0px");

                dialog_body.append(namehtml);

                //search for subdirectories and files
                function dir_search(dir_path,html) {
                    //get the contents of the diretory
                    that.contents.get(dir_path,{type: "directory"}).then(
                        function(model) {
                            //add the directory to notebook metadata
                            var file_info = {
                                "name": model.name,
                                "path": model.path,
                                "type": model.type
                            };
                            data_bundle.push(file_info);
                            //content contains all the sub files, so recursively
                            //add those files to the div and the metadata
                            model.content.forEach(function(child) {
                                var childhtml = $("<div/>")
                                                .attr("class","bundled-file")
                                                .attr("id",child.path)
                                                .text(child.name)
                                                .css("margin-left","12px");

                                html.append(childhtml);
                                if(child.type ==="directory"){
                                    dir_search(child.path,childhtml);
                                }
                                if(child.type === "file") {
                                    that.contents.get(child.path,{type: "file"}).then(
                                        function(model) {
                                            var child_file_info = {
                                                "name": model.name,
                                                "path": model.path,
                                                "type": model.type
                                            };
                                            data_bundle.push(child_file_info);
                                        }
                                    );
                                }
                            });
                        }
                    );
                }
                if(curr.type === "directory") {
                    dir_search(curr.path,namehtml);
                }
                //if it's not a directory, we can just shove it into the metadata
                if (curr.type === "file") {
                    that.contents.get(curr.path,{type: "file"}).then(
                        function(model) {
                            var file_info = {
                                "name": model.name,
                                "path": model.path,
                                "type": model.type
                            };
                            data_bundle.push(file_info);
                        }
                    );                
                }
            });

            //generate the modal
            var d = dialog.modal({
                title : "Bundle Data",
                body : dialog_body,
                default_button: "Cancel",
                buttons : {
                    Cancel: {},
                    Save : {
                        class: "btn-primary",
                        click: function() {
                            var old_databundle = [];

                            //we only care about the files in the same path as
                            //the tree page we're on as they're the only ones
                            //that could have been added/removed
                            var old_db_relevant = [];

                            var old_db_irrelevant = []; //to use later to rejoin
                            var old_db_irrelevant_checked = [];
                            if (nb.content.metadata.hasOwnProperty("databundle")) {
                                old_databundle = nb.content.metadata.databundle;
                                //for each file in the old data bundle, if it
                                //is relevant (i.e it could have been modified)
                                //then add it to old_db_relevant. otherwise
                                //add to irrelevant
                                old_databundle.forEach( function(item) {
                                    if(utils.url_path_split(item.path)[0] ===
                                       Jupyter.notebook_list.notebook_path)
                                    {
                                        old_db_relevant.push(item);
                                    } else {
                                        old_db_irrelevant.push(item);
                                    }
                                });
                                if(old_db_relevant.length > 0) {
                                    //we need to deal with adding directories'
                                    //subfolders and files to relevant and
                                    //removing them from irrelevant
                                    old_db_relevant.forEach(function(dir) {
                                        if(dir.type === "directory") {
                                            var dir_path = dir.path;
                                            old_db_irrelevant.forEach( function(item) {
                                                if(item.path.includes(dir_path)) {
                                                    old_db_relevant.push(item);
                                                } else {
                                                    old_db_irrelevant_checked.push(item);
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    old_db_irrelevant_checked = old_db_irrelevant;
                                }
                            }
                            var new_databundle = data_bundle.concat(old_db_irrelevant_checked);
                            nb.content.metadata.databundle = new_databundle;

                            //save the notebook then redirect back to the 
                            //notebook.
                            that.contents.save(nb.path,nb).then( function () {
                                sessionStorage.removeItem("bundle");
                                window.open(utils.url_path_join(Jupyter.notebook_list.base_url,
                                                                "notebooks",
                                                                utils.encode_uri_components(nb.path)),
                                            "_self");
                            }); //TODO: should probably error handle if the save operation fails or something?
                        }
                    }
                },
            });
        }
    };    

    module.exports = {
        load: load,
    };
});