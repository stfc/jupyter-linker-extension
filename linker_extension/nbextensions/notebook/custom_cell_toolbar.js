define([
    "base/js/namespace",
    "notebook/js/celltoolbar",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,celltoolbar,dialog,events) {
    "use strict";

    /*  
     *  Generate the cell toolbars.
     *  
     *  Jupyter provides the div of the toolbar and the associated cell,
     *  we just add all the required features.
     */ 
    var reference_url_toolbar = function(div, cell) {
    	//Container for help, toolbars
        var toolbar_container = $(div).addClass("cell-urls-container");
        toolbar_container.append("Add the reference URLs that relate to this cell:\n");
        
        //Create the URL container
        var URL_container = $("<div/>").addClass("cell-urls");
        toolbar_container.append(URL_container);
        
        //Create reference URLs list in cell metadata
        var metadata_set = cell.metadata.hasOwnProperty("referenceURLs");
        if(!metadata_set) {
        	console.log("Creating reference URL array")
            cell.metadata.referenceURLs = [];
        }
        
        //Create the add new URL button
        var add_url_button = $("<button/>")
    		.addClass("btn btn-xs btn-default add-cell-url-button")
    		.attr("type","button")
    		.bind("click", function(){create_referenceUrl(false)})
    		.attr("aria-label","Add reference URL");
        add_url_button.append($("<i>").addClass("fa fa-plus"));
        
        //If the metadata already exists, pre-populate the URL fields.
        if (metadata_set) {
        	populate_from_metadata();
        } else {
            //Create and setup the first reference URL
            create_referenceUrl(true);
        }
        
        function update_metadata() {
        	cell.metadata.referenceURLs = [];
            $(".referenceURL_" + cell.cell_id).each(function(i,e) {
                if($(e).val()) {
                    cell.metadata.referenceURLs.push($(e).val());
                }
            });
        }
        
        function create_referenceUrl(first) {
        	//Create a div to hold the input field and buttons.
            var reference_url_div = $("<div/>").addClass("referenceURL_div")
                                               .addClass("referenceURL_div_" + cell.cell_id);
            
            //Create and setup the input field.
            var reference_url = $("<input/>").addClass("referenceURL referenceURL_" + cell.cell_id)
                                            .attr("name","referenceURL");
            reference_url_div.append(reference_url);
            
           //On focus, allow keyboard editing of the URL.
            reference_url.focus(function() {
                Jupyter.keyboard_manager.edit_mode();
            });
            
            //When the URL changes, update the cell's metadata.
            reference_url.change(function() {
                update_metadata();
            });

            if (!first) {
            	var div = $(".referenceURL_div_" + cell.cell_id).last();
            	add_delete_button(div);
            }

            //Attach the add URL button to the latest URL.
            reference_url_div.append(add_url_button);

            URL_container.append(reference_url_div);
            
            return([reference_url, reference_url_div]);
        }    
        
        function add_delete_button(div) {
        	//Detach the add url button, and add a delete button to the previous URL.       	
        	add_url_button.detach();
        	
        	console.log("Found div: " + div.attr("class"));
        	
            var delete_button = $("<button/>")
                .addClass("btn btn-xs btn-default remove-cell-url-button")
                .attr("type","button")
                .attr("aria-label","Remove reference URL")
                .click(function() {
                    div.remove();
                    $(this).remove();
                    update_metadata();
                });

            delete_button.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            div.append(delete_button);
        }

        function populate_from_metadata() {
        	console.log("Populating URL array from metadata")
            var URLarray = cell.metadata.referenceURLs;
        	var base_url;
        	var base_url_div;
        	[base_url, base_url_div] = create_referenceUrl(true);
            URLarray.forEach(function(item,index) {
            	var reference_url;
            	var reference_url_div;
            	if (index == 0) {
            		[reference_url, reference_url_div] = [base_url, base_url_div];
            	} else {
            		[reference_url, reference_url_div] = create_referenceUrl(false);
            	}
            	console.log("Found URL: " + item);
            	reference_url.val(item);
            	
            	if (index != URLarray.length - 1) {
            		add_delete_button(reference_url_div);
            	}
            });
        }
    };
    
    var dataplot_toolbar = function(div, cell) {
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
    
    /*  
     * Callback Functions
     */ 
    var toggle_cell_references_bar = function() {
    	// Toggles the visibility of the references toolbar.
        var CellToolbar = celltoolbar.CellToolbar;
        if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension") {
            CellToolbar.global_show();

            CellToolbar.activate_preset("Linker Extension");
            Jupyter.notebook.metadata.celltoolbar = "Linker Extension";

            $("#toggle_cell_references_bar > a")
                .text("Hide cell references toolbar");
            
            show_dataplot_input(true);
        } else {
            CellToolbar.global_hide();
            delete Jupyter.notebook.metadata.celltoolbar;
            $("#toggle_cell_references_bar > a")
                .text("Show cell references toolbar");
            
            show_dataplot_input(false);
        }
    };

    var edit_current_cell = function() {
    	//Opens the edit toolbar for the current selected cell.
    	var cell = Jupyter.notebook.get_selected_cell();
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
            cell.element.find("div.input_area").hide();
    	}
    };    
    
    //Show or hide input areas for dataplot cells.
    var show_dataplot_input = function(show) {
        Jupyter.notebook.get_cells().forEach(function(cell){
        	if (is_dataplot(cell)) {
        		if (show) {
        			cell.element.find("div.input").show();
        		} else {
        			cell.element.find("div.input").hide();
        		}
        		
        	}
        });
    };
    
    //Is the cell a dataplot generator cell?
    var is_dataplot = function(cell) {
        if (cell.metadata.dataplot === undefined) {
            return false;
        } else {
            return cell.metadata.dataplot;
        }
    };

    var setup_celltoolbar = function(){
        var cell_toolbar = celltoolbar.CellToolbar;
        
        //Hide everything on page open.
        cell_toolbar.global_hide();
        delete Jupyter.notebook.metadata.celltoolbar;
        $("#toggle_cell_references_bar > a")
            .text("Show cell references toolbar");
       
        //Register the toolbars
        cell_toolbar.register_callback("linker_extension.add_reference_url",
                                       reference_url_toolbar);
        cell_toolbar.register_preset("Linker Extension",
                                     ["linker_extension.add_reference_url"],
                                     Jupyter.notebook);
        
        cell_toolbar.register_callback("linker_extension.add_dataplot",
                					   dataplot_toolbar);
        cell_toolbar.register_preset("Linker Extension Dataplot",
                                     ["linker_extension.add_dataplot"],
                                     Jupyter.notebook);
        
        //Unsure what setting these functions does?
    	cell_toolbar.prototype._rebuild = cell_toolbar.prototype.rebuild;
    	cell_toolbar.prototype.rebuild = function () {
            events.trigger("toolbar_rebuild.CellToolbar", this.cell);
            this._rebuild();
        };

        cell_toolbar._global_hide = cell_toolbar.global_hide;
        cell_toolbar.global_hide = function () {
        	cell_toolbar._global_hide();
            for (var i=0; i < cell_toolbar._instances.length; i++) {
                events.trigger("global_hide.CellToolbar",
                		cell_toolbar._instances[i].cell);
            }
        };
        
    };
    
    var register_callbacks = function() {
        var prefix = "linker_extension";
        
        var globalAction = {
            help: "Show/hide the cell references bar on all the cells ",
            help_index: "g",
            icon: "fa-eye",
            handler : toggle_cell_references_bar,
        };
        var globalActionName = "toggle-cell-references-bar";
        $("#toggle_cell_references_bar").click(function () {
            toggle_cell_references_bar();
        });
        Jupyter.notebook.keyboard_manager.actions.register(globalAction,globalActionName,prefix);

        var editCellAction = {
            help: "Edit the cell references bar on the current cell",
            help_index: "i",
            icon: "fa-eye",
            handler : edit_current_cell,
        };
        var editCellActionName = "edit-current-cell";
        $("#edit_current_cell").click(function () {
            edit_current_cell();
        });        
        Jupyter.notebook.keyboard_manager.actions.register(editCellAction,
        		                                           editCellActionName,
        		                                           prefix);

        console.log("Successfully registered callbacks");	
    }
    
    var load = function() {
        //Create the cell toolbar
    	setup_celltoolbar();
    	register_callbacks();
    	
    	//Hide all dataplot input areas.
    	show_dataplot_input(false);
    };
    
    module.exports = {load: load};
});