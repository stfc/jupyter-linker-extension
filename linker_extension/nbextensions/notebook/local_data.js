define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents) {
	
	//Find the path of the working directory.
	var notebook_path = Jupyter.notebook.notebook_path;
    var base_path_split = notebook_path.split("/");
    base_path_split.pop(); //Remove the filename
    var base_path = base_path_split.join("/");
    var md = Jupyter.notebook.metadata.reportmetadata;
	  
    /*  
     * Create the form for selecting files.
     * 
     * After creating the form, init_data_form must be called to create the nodes.
     * 
     * After the user has finished using the form, get_selected_values returns the chosen file names.
     */
    var data_form = function(id) {
        var form = $("<form/>").attr("id","data-form-" + id);
    	
    	var files_page = $("<fieldset/>").attr("id","files-page-" + id);

        var spinner = $("<i/>")
            .attr("id","file-loading-spinner")
            .addClass("fa fa-spinner fa-spin fa-fw fa-lg")
            .attr("aria-label","Loading files...");

        var loading_text = $("<span/>")
            .attr("id","files-loading-" + id)
            .text("Loading files...")
            .prepend(spinner);

        var file_tree_container = $("<div/>").attr("id","file-tree-container-" + id);

        var file_tree = $("<ul>")
            .attr("id","file-tree-" + id)
            .addClass("ztree");

        var warning = $("<p/>")
            .text("Note: checking a directory will automatically expand and check all " +
                  "subdirectories. If you check a large directory, this may take a lot of time")
            .addClass("fieldnote");

        var select_all_button = $("<button/>")
            .addClass("btn btn-default btn-sm")
            .attr("id","select-all-" + id)
            .text("Select all")
            .click(function() {
                var tree = $.fn.zTree.getZTreeObj("file-tree-" + id);
                tree.checkAllNodes(true);
            });

        var deselect_all_button = $("<button/>")
            .addClass("btn btn-default btn-sm")
            .attr("id","deselect-all-" + id)
            .text("Clear")
            .click(function() {
                var tree = $.fn.zTree.getZTreeObj("file-tree-" + id);
                tree.checkAllNodes(false);
            });

        
        files_page.append(loading_text);
        file_tree_container.append(select_all_button)
                           .append(deselect_all_button)
                           .append(file_tree);
        files_page.append(file_tree_container);
        files_page.append(warning);
        
        form.append(files_page);
        
        return(form);
    };
    
    /*  
     *  Find all the files within dir_path and return a list of nodes.
     */ 
    function get_nodes(dir_path) {
        var contents = Jupyter.notebook.contents;

        var node_list = contents.list_contents(dir_path).then(function(response) {
            var files = response.content;
            //final list of initial files to be passed to treeview
            
            var nodes = [];
            //we only want to path relative to the notebook folder
            //so remove the base path from all file paths
            files.forEach(function(item) {
                if(item.path.indexOf(base_path) !== 0) {
                	//Check the item is actually in the notebook's directory.
                	//This should never happen, but log the error if it does.
                    console.log("Missing base_path in node filename");
                } else {
                	//Find the item's path relative to the notebook's directory.
                    var rel_path = item.path.slice(base_path.length);
                    if(rel_path.charAt(0) === "/") {
                    	//Remove trailing slash if necessary.
                        rel_path = rel_path.slice(1);
                    }
                    var rel_path_split = rel_path.split("/");
                    var filename = rel_path_split.pop();

                    //Fill in the node's details.
                    var node = {};
                    node.path = rel_path;
                    node.mimetype = item.mimetype;
                    node.name = filename;
                    if(item.type === "directory") {
                        node.children = [];
                        node.isParent = true;
                        node.loaded = false;
                    }               
                    
                    nodes.push(node);
                }
            });

            return nodes;
        });
        
        return(node_list);
    }
    
    /*  
     *  Initialises the file tree.
     *  
     *  Must be called after the form has loaded.
     *  
     *  Takes a list of files to be pre-checked as an argument.
     */ 
    var init_data_form = function(init_files, id) {
    	console.log("Initialising " + id + " file tree with " + 
    			    init_files.length + " input files");
    	
    	var zTreeObj;
    	
    	//Called whenever a node is expanded.
    	var expand_callback = function(event, treeId, treeNode) {
    		//When a node is expanded, show all child nodes, and check them if necessary.
            if(treeNode.isParent && !treeNode.loaded) {
                $("#files-loading-" + id).show();

                get_nodes(treeNode.path).then(function(data) {
                    zTreeObj.addNodes(treeNode,0,data);
                    treeNode.loaded = true;
                     
                    //If the parent was checked, check all child nodes.
                    if(treeNode.checked) {
                        treeNode.children.forEach(function(item) {
                            zTreeObj.checkNode(item,true,false,true);
                        });
                    }
                });
            }
        };
        
        //Called whenever a node is checked.
        var check_callback = function(event, treeId, treeNode) {
            //If a node has children, it should be expanded if checked.
            if(treeNode.checked && !treeNode.loaded) {
                zTreeObj.expandNode(treeNode,true,true,false,true);
            }
        };
        
        //Called whenever a node is created.
        var creation_callback = function(event, treeid, treeNode) {
        	//Only way to detect that creation finished is 
        	//to call this function after a short timeout.

        	var on_create = function() {    
        		$("#files-loading-" + id).hide();
                
                //Check if the new node (or a child) needs to be pre-checked.
                for (var i = 0; i < init_files.length; i++) {
                	var filename = init_files[i].path;
                	if (filename.indexOf(treeNode.path) == 0 ) {
                		if (!treeNode.isParent) {
                			//This file needs to be checked.
                			console.log("Found " + treeNode.path + " needs to be pre-checked");
                			zTreeObj.checkNode(treeNode,true,false,true);
                			break;
                		} else {
                			//A child of this node should be checked, so expand the node and continue.
                			console.log("A child of " + treeNode.path + " needs to be checked");
                			if (!treeNode.loaded) {
                				zTreeObj.expandNode(treeNode,true,true,false,true);
                				break;
                			}
                		}
                	}
                }
                
                //Update the abstract with checked nodes.
                var checked_nodes = zTreeObj.getCheckedNodes();
                var abstract_string = "";
                checked_nodes.forEach(function(node) {
                    if(!node.isParent) {
                        abstract_string += node.name + "\n\n";
                    }
                });
                $("#data-abstract").val(abstract_string);
        	}
        	
            clearTimeout();
            setTimeout(on_create,100);
        };
    	
        //Find the nodes, register the callbacks and load the tree.
        get_nodes(base_path).then(function(data) {
            var setting = {
                check: {
                    enable: true,
                    chkboxType: { "Y": "ps", "N": "ps" },
                },
                callback: {
                    onExpand: expand_callback,
                    onCheck: check_callback,
                    onNodeCreated: creation_callback
                }
            };
            zTreeObj = $.fn.zTree.init($("#file-tree-" + id), setting, data);

            $("#files-loading-" + id).hide();
        });
    };   

    /*  
     *  Validates data files. Clears errors when run and adds
     *  errors above the file selector
     */ 
    var validate_files = function(id) {
        $(".data-form-error").remove();

        var tree = $.fn.zTree.getZTreeObj("file-tree-" + id);
        var files = tree.getCheckedNodes();
        if(files.length === 0) {
            var files_error = $("<div/>")
                .attr("id","data-files-missing-error-" + id)
                .addClass("data-form-error")
                .text("Please select at least one file");

            $("#file-tree-" + id).before(files_error);
        }
        //this shouldn't happen due to out checkbox logic, but juuuust in case
        files.forEach(function(file) {
            if(file.isParent && !file.loaded) {
                var directory_error = $("<div/>")
                .attr("id","directory-not-expanded-error")
                .addClass("data-form-error")
                .text(file.name + " has not been expanded yet has been selected, " +
                      "please expand it to load its children");

                $("#file-tree-" + id).before(directory_error);
            }
        });


        $(".data-form-error").css("color", "red");
    };
    
    var get_selected_values = function(list_to_fill, id) {
        var tree = $.fn.zTree.getZTreeObj("file-tree-" + id);

        var all_files = tree.getCheckedNodes();
        while(list_to_fill.length > 0) {
        	list_to_fill.pop();
        }
        all_files.forEach(function(file) {
        	//Don't return directories
        	if(!file.isParent) {
                list_to_fill.push(file);
        	}
        });
    }
    
    var reset_associated_data = function(id) {
    	//Overwrite the associated data with the currently checked files.
    	console.log("Resetting associated data");
    	
    	md = Jupyter.notebook.metadata.reportmetadata;
    	
    	md.files = [];
    	get_selected_values(md.files, id);

    	console.log("Associated data reset: " + 
    			    md.files.length +
    			    " files associated");
    }
    
    var update_associated_data = function(id) {
    	//Add any checked files to the notebook's associated data.
    	console.log("Updating associated data")
    	
    	var checked = [];
    	get_selected_values(checked, id);
    	
    	md = Jupyter.notebook.metadata.reportmetadata;
    	if (!md.hasOwnProperty("files")) {
    		md.files = checked;
    	} else {
    		var associated_data = md.files;
    		
    		function already_associated(path) {
    			//Check if a path is already included in the associated data.
    			for (var i = 0; i < associated_data.length; i++) {
            		if (associated_data[i].path.indexOf(path) == 0) {
            			return true;
            		}
            	}
    			return false;
    		}
    		
    		for (var i = 0; i < checked.length; i++) {
        		if (!already_associated(checked[i].path)) {
        			associated_data.push(checked[i]);
        		}
        	}
    	}
    	
    	console.log("Associated data updated: " + 
    			    md.files.length +
    			    " files associated");
    }
    
    var get_display_text = function (file_list) {
		if (!file_list || file_list.length == 0) {
    		return("No files selected");
    	} else if (file_list.length == 1) {
    		return("1 file selected");
    	} else {
    		return(file_list.length + " files selected");
    	}
    }
    
    var open_modal = function(file_list, display, id) {   	
    	var modal = dialog.modal({
            title: "Input datafiles",
            body: data_form(id),
            buttons: {
                Cancel: {
                	id: "cancel"
                },
                Select: { 
                    class : "btn-primary",
                    id : "select",
                    click: function() {
                    	get_selected_values(file_list, id);
                    	display.text(get_display_text(file_list, id));
                    	return true;
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        modal.on("shown.bs.modal", function () {
            init_data_form(file_list, id);
        });
	}

    module.exports = {
        data_form: data_form,
        init_data_form: init_data_form,
        validate_files: validate_files,
        update_associated_data: update_associated_data,
        reset_associated_data: reset_associated_data,
        get_display_text: get_display_text,
        open_modal: open_modal,
    };
});