define([
    "base/js/namespace",
    "notebook/js/celltoolbar",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,celltoolbar,dialog,events) {
    "use strict";

    /*  
     *  This contains the stuff we want doing when the extension/page is loaded.
     *  We have to register our toolbar as a CellToolbar preset. We also add an
     *  action and button for our toggle button.
     */  
    var load = function() {
        console.log("Loading custom cell toolbar");
        var CellToolbar = celltoolbar.CellToolbar;

        CellToolbar.prototype._rebuild = CellToolbar.prototype.rebuild;
        CellToolbar.prototype.rebuild = function () {
            events.trigger("toolbar_rebuild.CellToolbar", this.cell);
            this._rebuild();
        };

        CellToolbar._global_hide = CellToolbar.global_hide;
        CellToolbar.global_hide = function () {
            CellToolbar._global_hide();
            for (var i=0; i < CellToolbar._instances.length; i++) {
                events.trigger("global_hide.CellToolbar",
                               CellToolbar._instances[i].cell);
            }
        };
        
        //Call global hide so toolbar is hidden by default on opening page.
        CellToolbar.global_hide();
        
        Jupyter.notebook.get_cells().forEach(function(cell){
        	if (is_dataplot(cell)) {
        		cell.element.find("div.input").hide();
        	}
        });
       
        var reference_preset = [];

        CellToolbar.register_callback("linker_extension.add_reference_url",
                                      add_reference_url);
        reference_preset.push("linker_extension.add_reference_url");

        CellToolbar.register_preset("Linker Extension",
                                    reference_preset,
                                    Jupyter.notebook);
        
        var dataplot_preset = [];

        CellToolbar.register_callback("linker_extension.add_dataplot",
                add_dataplot);
        dataplot_preset.push("linker_extension.add_dataplot");

        CellToolbar.register_preset("Linker Extension Dataplot",
                                    dataplot_preset,
                                    Jupyter.notebook);

        var globalAction = {
            help: "Show/hide the cell references bar on all the cells ",
            help_index: "g",
            icon: "fa-eye",
            handler : toggle_cell_references_bar,
        };

        var prefix = "linker_extension";
        var globalActionName = "toggle-cell-references-bar";
        Jupyter.notebook.keyboard_manager.actions.register(globalAction,globalActionName,prefix);

        $("#toggle_cell_references_bar").click(function () {
            toggle_cell_references_bar();
        });
        
        console.log("Defining add toolbar");
        
        var addCellAction = {
            help: "Add a cell references bar on the current cell",
            help_index: "h",
            icon: "fa-eye",
            handler : add_current_cell_bar,
        };

        var prefix = "linker_extension";
        var addCellActionName = "add-current-cell-bar";
        
        console.log("Registering with jupyter");
        Jupyter.notebook.keyboard_manager.actions.register(addCellAction,addCellActionName,prefix);

        console.log("Setting onclick function");
        $("#add_current_cell_bar").click(function () {
            add_current_cell_bar();
        });
        
        console.log("Defining remove toolbar");
        
        var removeCellAction = {
            help: "Remove the cell references bar on the current cell",
            help_index: "i",
            icon: "fa-eye",
            handler : remove_current_cell_bar,
        };

        var prefix = "linker_extension";
        var removeCellActionName = "remove-current-cell-bar";
        
        console.log("Registering with jupyter");
        Jupyter.notebook.keyboard_manager.actions.register(removeCellAction,removeCellActionName,prefix);

        console.log("Setting onclick function");
        $("#remove_current_cell_bar").click(function () {
            remove_current_cell_bar();
        });
        
        
        
        var editCellAction = {
                help: "Edit the cell references bar on the current cell",
                help_index: "i",
                icon: "fa-eye",
                handler : edit_current_cell,
            };

            var prefix = "linker_extension";
            var editCellActionName = "edit-current-cell";
            
            console.log("Registering with jupyter");
            Jupyter.notebook.keyboard_manager.actions.register(editCellAction,
            		                                           editCellActionName,
            		                                           prefix);

            console.log("Setting onclick function");
            $("#edit_current_cell").click(function () {
                edit_current_cell();
            });
        
        console.log("Successfully loaded custom cell toolbar");
    };

    /*  
     *  Toggles the visibility of our toolbar. This is due to the celltoolbar
     *  menu being a bit of a pain to find. It changes text depending whether
     *  our toolbar preset is currently active or not.
     */ 
    var toggle_cell_references_bar = function() {
        var CellToolbar = celltoolbar.CellToolbar;
        if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension") {
            CellToolbar.global_show();

            CellToolbar.activate_preset("Linker Extension");
            Jupyter.notebook.metadata.celltoolbar = "Linker Extension";

            $("#toggle_cell_references_bar > a")
                .text("Hide cell references toolbar");
            
            Jupyter.notebook.get_cells().forEach(function(cell){
            	if (is_dataplot(cell)) {
            		cell.element.find("div.input").show();
            	}
            });
        } else {
            CellToolbar.global_hide();
            delete Jupyter.notebook.metadata.celltoolbar;
            $("#toggle_cell_references_bar > a")
                .text("Show cell references toolbar");
            
            Jupyter.notebook.get_cells().forEach(function(cell){
            	if (is_dataplot(cell)) {
            		cell.element.find("div.input").hide();
            	}
            });
        }
    };
    
    
    /*  
     *  Adds a toolbar to the current cell toobar.
     */ 
    var add_current_cell_bar = function() {
        var selectedCell = Jupyter.notebook.get_selected_cell();
        console.log("Showing cell toolbar for " + Jupyter.notebook.find_cell_index(selectedCell));
        selectedCell.element.find("div.ctb_hideshow").addClass("ctb_show");
    };
    
    /*  
     *  Toggles the visibility of our current cell toobar.
     */ 
    var remove_current_cell_bar = function() {
        var selectedCell = Jupyter.notebook.get_selected_cell();
        console.log("Hiding cell toolbar for " + Jupyter.notebook.find_cell_index(selectedCell));
        selectedCell.element.find("div.ctb_hideshow").removeClass("ctb_show");
    };
    
    
    /*  
     *  Toggles the visibility of our current cell toobar.
     */ 
    var edit_current_cell = function() {
        edit_cell(Jupyter.notebook.get_selected_cell());
    };

    /*  
     *  Toggles the visibility of our current cell toobar.
     */ 
    var edit_cell = function(cell) {
    	if (is_dataplot(cell)) {
        	var CellToolbar = celltoolbar.CellToolbar;
        	CellToolbar.global_show();
            CellToolbar.activate_preset("Linker Extension Dataplot");
            Jupyter.notebook.metadata.celltoolbar = "Linker Extension Dataplot";
            
            var cells = Jupyter.notebook.get_cells(); 
            
            cells.forEach(function(cell){
            	cell.element.find("div.ctb_hideshow").removeClass("ctb_show");
            	if (is_dataplot(cell)) {
            		cell.element.find("div.input").hide();
            	}
            });
            
            cell.element.find("div.ctb_hideshow").addClass("ctb_show");
            cell.element.find("div.input").show();
            //cell.element.find("div.input_area").hide();
    	}
    };
    

    /*  
     *  The actual celltoolbar stuff. The CellToolbar stuff in Jupyter gives our
     *  preset the div that we can attach our stuff to and the cell that is currently
     *  being edited. We add some help text and a text input with a button that spawns
     *  more text inputs. We have it so that when any of the inputs changes they
     *  update the cell's metadata. 
     */ 
    var add_reference_url = function(div, cell) {
        var help_text = "Add the reference URLs that relate to this cell:\n";
        var toolbar_container = $(div).addClass("cell-urls-container");


        var URL_container = $("<div/>").addClass("cell-urls");
        toolbar_container.append(help_text);
        toolbar_container.append(URL_container);

        var md_set = cell.metadata.hasOwnProperty("referenceURLs");
        if(!md_set) {
            cell.metadata.referenceURLs = [];
        }

        var base_referenceURL = $("<input/>")
            .addClass("referenceURL referenceURL_" + cell.cell_id)
            .attr("name","referenceURL");

        var base_referenceURL_div = $("<div/>")
            .addClass("referenceURL_div")
            .addClass("referenceURL_div_" + cell.cell_id);

        base_referenceURL_div.append(base_referenceURL);

        //on focus switch into edit mode so we can type text normally
        base_referenceURL.focus(function() {
            Jupyter.keyboard_manager.edit_mode();
        });

        //does what it says - updates the notebook metadata. Note - it doesn't
        //save the metadata, just updates it.
        function update_metadata() {
            cell.metadata.referenceURLs = [];
            $(".referenceURL_" + cell.cell_id).each(function(i,e) {
                if($(e).val()) {
                    cell.metadata.referenceURLs.push($(e).val());
                }
            });
        }

        //put all values in metadata on change
        base_referenceURL.change(function() {
            update_metadata();
        });

        /*  
         *  Adds an extra URL input box whilst adding a remove button to the
         *  previous input box. 
         */ 
        function addURL() {
            var newURL = ($("<div/>"))
                          .addClass("referenceURL_div")
                          .addClass("referenceURL_div_" + cell.cell_id);
            var URL = $("<input/>")
                .attr("class","referenceURL referenceURL_" + cell.cell_id)
                .attr("type","text")
                .attr("name","referenceURL");

            //on focus switch into edit mode so we can type text normally
            URL.focus(function() {
                Jupyter.keyboard_manager.edit_mode();
            });

            URL.change(function() { //save all values to metadata on change
                update_metadata();
            });

            var previousURL = $(".referenceURL_div_" + cell.cell_id).last();

            //detach from the previously last url input so
            //we can put it back on the new one
            addURLButton.detach(); 
            var deleteURL = $("<button/>")
                .addClass("btn btn-xs btn-default remove-cell-url-button")
                .attr("type","button")
                .attr("aria-label","Remove reference URL")
                    .click(function() {
                        previousURL.remove();
                        $(this).remove();
                        update_metadata();
                    }); //add a remove button to the previously last url

            deleteURL.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previousURL.append(deleteURL);
            URL_container.append(newURL.append(URL).append(addURLButton));
            return [URL,newURL];
        }
        
        

        var addURLButton = $("<button/>")
            .addClass("btn btn-xs btn-default add-cell-url-button")
            .attr("type","button")
            .bind("click",addURL)
            .attr("aria-label","Add reference URL");

        addURLButton.append($("<i>").addClass("fa fa-plus"));
        base_referenceURL_div.append(addURLButton);

        URL_container.append(base_referenceURL_div);

        /*  
         *  Repopulate from existig notebook metadata 
         */ 
        if(md_set) {
            var URLarr = cell.metadata.referenceURLs;
            var deleteURL;
            URLarr.forEach(function(item,index) {
                if(index === 0) {
                    base_referenceURL.val(item);
                    if(URLarr.length > 1) {
                        deleteURL = $("<button/>")
                            .addClass("btn btn-xs btn-default remove-cell-url-button")
                            .attr("type","button")
                            .attr("aria-label","Remove reference URL")
                                .click(function() {
                                    base_referenceURL.remove();
                                    $(this).remove();

                                    update_metadata();
                                });
                        deleteURL.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        base_referenceURL_div.append(deleteURL);
                    }
                    
                } else {
                    var URL = addURL();
                    URL[0].val(item);
                    if(index !== URLarr.length - 1) { //if not last element
                        deleteURL = $("<button/>")
                            .addClass("btn btn-xs btn-default remove-cell-url-button")
                            .attr("type","button")
                            .attr("aria-label","Remove reference URL")
                                .click(function() {
                                    URL[1].remove();
                                    $(this).remove();

                                    update_metadata();
                                });
                        deleteURL.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        URL[1].append(deleteURL);
                    }
                }
            });
        }
    };
    
    var add_dataplot = function(div, cell) {
    	$(div).addClass("generate-section");
        var title_container = $("<div/>").addClass("generate-title")
                                         .append("Generate dataplot cell");

        var code_container = $("<div/>").addClass("generate-code");
        
        var find_file_button = $("<span/>").addClass("btn btn-sm btn-default btn-file").text("Find file");
        var find_file_feedback = $("<input/>")
            .attr("readonly","readonly")
            .attr("type","text")
            .attr("id", "filename")
            .prop("disabled",true);
        var find_file = $("<input>")
            .attr("type","file")
            .attr("id","find_file")
            .attr("required","required")
            .attr("name","find_file[]")
            .attr("multiple","multiple");
        find_file_button.append(find_file);
        
        find_file.change(function() {
            var input = $(this);
            var numFiles = input.get(0).files ? input.get(0).files.length : 1;
            var label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
            input.trigger("fileselect", [numFiles, label]);
        });

        find_file.on("fileselect", function(event, numFiles, label) {
            var log = numFiles > 1 ? numFiles + " files selected" : label;

            cell.metadata.inputfile = label;
            find_file_feedback.val(log);
        });
        
        code_container.append(find_file_button)
                      .append(find_file_feedback);
        
        var xaxis_input = $("<input/>")
        .addClass("xaxis xaxis_" + cell.cell_id)
        .attr("name","xaxis")
        .change(function() {
            update_metadata();
        })
        .focus(function() {
            Jupyter.keyboard_manager.edit_mode();
        });
        
        var xaxis_div = $("<div/>")
        .addClass("xaxis_div")
        .addClass("xaxis_div_" + cell.cell_id);

        xaxis_div.append("x axis label:")
        xaxis_div.append(xaxis_input);

        
        var yaxis_input = $("<input/>")
        .addClass("yaxis yaxis_" + cell.cell_id)
        .attr("name","yaxis")
        .change(function() {
            update_metadata();
        })
        .focus(function() {
            Jupyter.keyboard_manager.edit_mode();
        });
        
        var yaxis_div = $("<div/>")
        .addClass("yaxis_div")
        .addClass("yaxis_div_" + cell.cell_id);

        yaxis_div.append("y axis label:")
        yaxis_div.append(yaxis_input);
        

        
        //does what it says - updates the notebook metadata. Note - it doesn't
        //save the metadata, just updates it.
        function update_metadata() {
        	cell.metadata.yaxis = $(".yaxis_" + cell.cell_id).val();
        	cell.metadata.xaxis = $(".xaxis_" + cell.cell_id).val();
        }
        
        
        var generate_container = $("<div/>").addClass("generate-code");
        
        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                          .text("Generate code")
                                          .click(function() {
                                              generate_dataplot(cell);
                                          });
        
        generate_container.append(generate_button);
        
        $(div).append(title_container);
        $(div).append(code_container);
        $(div).append(xaxis_div);
        $(div).append(yaxis_div);
        //$(div).append(title_div);
        $(div).append(generate_container);
        
    };
    
    
    var generate_dataplot = function(cell) {
    	var dataplot_code = "filename = '" + cell.metadata.inputfile + "'\n" +
    	                    "xaxis = '" + cell.metadata.xaxis + "'\n" +
    	                    "yaxis = '" + cell.metadata.yaxis + "'\n" +
    	"import matplotlib.pyplot as plt\n" +
    	"import re\n" +
    	"\n" +
    	"with open('./data/' + filename) as f:\n" +
    	"    data = f.read()\n" +
    	"\n" +
    	"data = data.rstrip()\n" +
    	"data = data.split('\\n')\n" +
    	"\n" +
    	"x = list()\n" +
    	"y = list()\n" +
    	"\n" +
    	"for row in data:\n" +
    	"    xVar = re.split('\\s+', row)[0]\n" +
    	"    yVar = re.split('\\s+', row)[1]\n" +
    	"\n" +
    	"    try:\n" +
    	"        float(xVar)\n" +
    	"        float(yVar)\n" +
    	"        x.append(xVar)\n" +
    	"        y.append(yVar)\n" +
    	"    except Exception:\n" +
    	"        pass\n" +
    	"\n" +
    	"fig = plt.figure()\n" +
    	"\n" +
    	"ax1 = fig.add_subplot(111)\n" +
    	"\n" +
    	"ax1.set_title('title')\n" +
    	"ax1.set_xlabel(xaxis)\n" +
    	"ax1.set_ylabel(yaxis)\n" +
    	"\n" +
    	"ax1.plot(x,y, c='r', label=filename)\n" +
    	"\n" +
    	"leg = ax1.legend()\n" +
    	"\n" +
    	"plt.show()\n" +
    	"\n"
    	
    	cell.set_text(dataplot_code);
        cell.execute();
    }

    module.exports = {load: load};

    /**
     * Is the cell an dataplot generator cell?
     */
    var is_dataplot = function(cell) {
        if (cell.metadata.dataplot === undefined) {
            return false;
        } else {
            return cell.metadata.dataplot;
        }
    };
});