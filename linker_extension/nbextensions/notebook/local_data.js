define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./modify_notebook_html",
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents) {
	
	var notebook_path = Jupyter.notebook.notebook_path;
    var base_path_split = notebook_path.split("/");
    base_path_split.pop(); //pop removes last element of array - removes file name
    var base_path = base_path_split.join("/");
	  
    /*  
     *  Given a directory path, uses list_contents to get the contents of that 
     *  directory and returns a promise with the data needed to create our tree nodes
     */ 
    var get_nodes = function(dir_path) {
        var contents = Jupyter.notebook.contents;

        var nodes = contents.list_contents(dir_path).then(function(response) {
            var files = response.content;
            //final list of initial files to be passed to treeview
            var data = [];

            //we only want to path relative to the notebook folder
            //so remove the base path from all file paths
            files.forEach(function(item) {
                var base_index = item.path.indexOf(base_path);
                if(base_index !== 0) {
                    console.log("Missing base_path in node filename");
                } else{
                    var rel_path = item.path.slice(base_path.length);
                    if(rel_path.charAt(0) === "/") {
                    	//Remove trailing slash if necessary.
                        rel_path = rel_path.slice(1);
                    }
                    var rel_path_split = rel_path.split("/");
                    var filename = rel_path_split.pop(); //pop removes last element of array - gives file name

                    var node = {};
                    node.path = rel_path;
                    node.mimetype = item.mimetype;
                    node.name = filename;
                    //give some indication that a directory can be expanded
                    if(item.type === "directory") {
                        node.children = [];
                        node.isParent = true;
                        node.loaded = false;
                    }               
                    
                    data.push(node);
                }
            });

            return data;
        });
        
        return(nodes);
    }

    /*  
     *  Initialises our file tree.
     *  
     *  Takes a list of files to be pre-checked as an argument.
     */ 
    var init_tree = function(files) {
    	console.log("Initialising file tree: " + files);
    	
        get_nodes(base_path).then(function(data) {
            var setting = {
                check: {
                    enable: true,
                    chkboxType: { "Y": "ps", "N": "ps" },

                },
                callback: {
                    onExpand: function(event, treeId, treeNode) {
                        //we haven't expanded yet
                        if(treeNode.isParent && !treeNode.loaded) {
                            $("#files-loading").show();
                            //get children for the node we're expanding
                            get_nodes(treeNode.path).then(function(data) {
                                zTreeObj.addNodes(treeNode,0,data);
                                treeNode.loaded = true;
                                //we were expanded by being checked, so check
                                //the new children
                                if(treeNode.checked) {
                                    treeNode.children.forEach(function(item) {
                                        zTreeObj.checkNode(item,true,false,true);
                                    });
                                }
                            });
                        }
                    },
                    onCheck: function(event, treeId, treeNode) {
                        //when we check something expand it, if we haven't already loaded
                        if(treeNode.checked && !treeNode.loaded) {
                            zTreeObj.expandNode(treeNode,true,true,false,true);
                        }
                    },
                    onNodeCreated: function(event, treeid, treeNode) {
                        //only way to detect that we've finished is to set a timeout
                        clearTimeout();
                        setTimeout(function() {
                            $("#files-loading").hide();
                            
                            console.log("New node created: " + treeNode.path);
                            
                            for (var i = 0; i < files.length; i++) {
                            	var filename = files[i];
                            	if (filename.indexOf(treeNode.path) == 0 ) {
                            		if (treeNode.isParent) {
                            			console.log("A child of " + treeNode.path + " needs to be changed");
                            			//A child of this node should be checked.
                            			if (!treeNode.loaded) {
                            				zTreeObj.expandNode(treeNode,true,true,false,true);
                            				break;
                            			}
                            		} else {
                            			zTreeObj.checkNode(treeNode,true,false,true);
                            			break;
                            		}
                            	}
                            }
                            
                            var new_nodes = zTreeObj.getCheckedNodes();

                            //don't need to update the abstract whilst looking
                            //for files, so only do it when we think we've
                            //finished loading files.
                            var string = "";
                            new_nodes.forEach(function(node) {
                                if(!node.isParent) {
                                    string  = string + node.name + "\n\n";
                                }
                            });
                            $("#data-abstract").val(string);
                        },100);
                    }
                }
            };
            var zTreeObj = $.fn.zTree.init($("#file-tree"), setting, data);
            
            $("#files-loading").hide();
        });
    };

    /*  
     *  Creates the form fields for data upload. Generates the container for
     *  our file tree to load into later.
     *  The rest is generating form fields for data metadata. It autofills
     *  abstract with each file name of the acciated files on a seperate line,
     *  and the rest of the fields have no defaults. Returns the dialog body
     *  and also passes along the file names, paths and types.
     */

    var data_form = function() {
        var form = $("<form/>").attr("id","data-form")
    	
    	var files_page = $("<fieldset/>").attr("id","files-page");

        var spinner = $("<i/>")
            .attr("id","file-loading-spinner")
            .addClass("fa fa-spinner fa-spin fa-fw fa-lg")
            .attr("aria-label","Loading files...");

        var loading_text = $("<span/>")
            .attr("id","files-loading")
            .text("Loading files...")
            .prepend(spinner);

        var file_tree_container = $("<div/>").attr("id","file-tree-container");

        var file_tree = $("<ul>")
            .attr("id","file-tree")
            .addClass("ztree");

        var warning = $("<p/>")
            .text("WARNING: checking a directory will automatically expand and check all " +
                  "subdirectories. If you check a large directory, this may take a lot of time")
            .css("color","red");

        var select_all_button = $("<button/>")
            .addClass("btn btn-default btn-sm")
            .attr("id","select-all")
            .text("Select all loaded files")
            .click(function() {
                var tree = $.fn.zTree.getZTreeObj("file-tree");
                tree.checkAllNodes(true);
            });

        var deselect_all_button = $("<button/>")
            .addClass("btn btn-default btn-sm")
            .attr("id","deselect-all")
            .text("Deselect all loaded files")
            .click(function() {
                var tree = $.fn.zTree.getZTreeObj("file-tree");
                tree.checkAllNodes(false);
            });

        files_page.append(warning);
        files_page.append(loading_text);
        file_tree_container.append(select_all_button)
                           .append(deselect_all_button)
                           .append(file_tree);
        files_page.append(file_tree_container);

        form.append(files_page);
        
        return(form);
    };
    
    /*  
     *  Validates data files. Clears errors when run and adds
     *  errors above the file selector
     */ 
    var validate_files = function() {
        $(".data-form-error").remove();

        var tree = $.fn.zTree.getZTreeObj("file-tree");
        var files = tree.getCheckedNodes();
        if(files.length === 0) {
            var files_error = $("<div/>")
                .attr("id","data-files-missing-error")
                .addClass("data-form-error")
                .text("Please select at least one file");

            $("#file-tree").before(files_error);
        }
        //this shouldn't happen due to out checkbox logic, but juuuust in case
        files.forEach(function(file) {
            if(file.isParent && !file.loaded) {
                var directory_error = $("<div/>")
                .attr("id","directory-not-expanded-error")
                .addClass("data-form-error")
                .text(file.name + " has not been expanded yet has been selected, " +
                      "please expand it to load its children");

                $("#file-tree").before(directory_error);
            }
        });


        $(".data-form-error").css("color", "red");
    };
    
    var get_selected_values = function() {
        var tree = $.fn.zTree.getZTreeObj("file-tree");

        var all_files = tree.getCheckedNodes();
        var files = [];
        all_files.forEach(function(file) {
        	//Don't return directories
        	if(!file.isParent) {
                files.push(file.path);
        	}
        });
        
        return(files);
    }

    module.exports = {
        data_form: data_form,
        validate_files: validate_files,
        get_nodes: get_nodes,
        init_tree: init_tree,
        get_selected_values: get_selected_values
    };
});