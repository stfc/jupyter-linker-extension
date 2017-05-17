define([
    "base/js/namespace",
    "notebook/js/celltoolbar",
    "base/js/dialog",
    "base/js/events",
    "./references_toolbar",
    "./dataplot_toolbar"
], function(Jupyter,
		    celltoolbar,
		    dialog,
		    events,
		    references,
		    dataplot) {
    "use strict";
    
    var load = function() {
        //Create the cell toolbar
    	setup_celltoolbar();
    	register_callbacks();
    	
    	//Hide all dataplot input areas.
    	show_dataplot_input(false);
    };
    
    var setup_celltoolbar = function(){
        var cell_toolbar = celltoolbar.CellToolbar;
        
        //Hide everything on page open.
        cell_toolbar.global_hide();
        delete Jupyter.notebook.metadata.celltoolbar;
        $("#toggle_cell_references_bar > a")
            .text("Show cell references toolbar");
       
        //Register the toolbars
        cell_toolbar.register_callback("linker_extension.reference_url_toolbar",
                                       references.reference_url_toolbar);
        cell_toolbar.register_preset("Linker Extension",
                                     ["linker_extension.reference_url_toolbar"],
                                     Jupyter.notebook);
        
        cell_toolbar.register_callback("linker_extension.dataplot_toolbar",
				                       dataplot.dataplot_toolbar);
		cell_toolbar.register_preset("Linker Extension Dataplot",
									 ["linker_extension.dataplot_toolbar"],
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
    }
    
    //Opens the edit toolbar for the current selected cell.
    var edit_current_cell = function() {
    	var cell = Jupyter.notebook.get_selected_cell();
    	if (dataplot.is_dataplot(cell)) {
        	var CellToolbar = celltoolbar.CellToolbar;
        	CellToolbar.global_show();
            CellToolbar.activate_preset("Linker Extension Dataplot");
            Jupyter.notebook.metadata.celltoolbar = "Linker Extension Dataplot";
            
            var cells = Jupyter.notebook.get_cells(); 
            
            cells.forEach(function(cell){
            	cell.element.find("div.ctb_hideshow").removeClass("ctb_show");
            	if (dataplot.is_dataplot(cell)) {
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
        	if (dataplot.is_dataplot(cell)) {
        		if (show) {
        			cell.element.find("div.input").show();
        		} else {
        			cell.element.find("div.input").hide();
        		}
        		
        	}
        });
    };
   
    module.exports = {load: load};
});