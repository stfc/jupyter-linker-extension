define([
    "base/js/namespace",
    "notebook/js/celltoolbar",
    "base/js/dialog",
    "base/js/events",
    "./references_toolbar",
    "./dataplot_toolbar",
    "./analysis_toolbar"
], function(Jupyter,
		    celltoolbar,
		    dialog,
		    events,
		    references,
		    dataplot,
		    analysis) {
    "use strict";
    
    var load = function() {
        //Create the cell toolbar
    	setup_celltoolbar();
    	register_callbacks();
    	
    	//Hide all input areas.
    	show_input(false);
    };
    
    var cell_toolbar = celltoolbar.CellToolbar;
    
    var setup_celltoolbar = function(){
        //Hide everything on page open.
        cell_toolbar.global_hide();
        delete Jupyter.notebook.metadata.celltoolbar;
        $("#toggle_cell_references_bar > a")
            .text("Show cell references toolbar");
       
        //Register the toolbars
        cell_toolbar.register_callback("linker_extension.reference_url_toolbar",
                                       references.reference_url_toolbar);
        cell_toolbar.register_preset("Linker Extension References",
                                     ["linker_extension.reference_url_toolbar"],
                                     Jupyter.notebook);
        
        cell_toolbar.register_callback("linker_extension.dataplot_toolbar",
				                       dataplot.dataplot_toolbar);
		cell_toolbar.register_preset("Linker Extension Dataplot",
									 ["linker_extension.dataplot_toolbar"],
		                             Jupyter.notebook);
		
        cell_toolbar.register_callback("linker_extension.analysis_toolbar",
                                       analysis.analysis_toolbar);
        cell_toolbar.register_preset("Linker Extension Analysis",
				                     ["linker_extension.analysis_toolbar"],
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
        
        var insertDataplotAction = {
                help: "Insert a dataplot cell below the current cell",
                help_index: "i",
                icon: "fa-eye",
                handler : insert_dataplot_cell,
        };
        var insertDataplotActionName = "insert-dataplot-cell";
        $("#insert_dataplot_cell").click(function () {
            insert_dataplot_cell();
        });        
        Jupyter.notebook.keyboard_manager.actions.register(insertDataplotAction,
        		                                           insertDataplotActionName,
        		                                           prefix);
        
        var insertAnalysisAction = {
                help: "Insert an analysis cell below the current cell",
                help_index: "i",
                icon: "fa-eye",
                handler : insert_analysis_cell,
        };
        var insertAnalysisActionName = "insert-analysis-cell";
        $("#insert_analysis_cell").click(function () {
            insert_analysis_cell();
        });        
        Jupyter.notebook.keyboard_manager.actions.register(insertAnalysisAction,
        		                                           insertAnalysisActionName,
        		                                           prefix);

        console.log("Successfully registered callbacks");	
    }
    
    /*  
     * Callback Functions
     */ 
    var toggle_cell_references_bar = function() {
    	// Toggles the visibility of the references toolbar.
        if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension References") {
            cell_toolbar.global_show();
        	
            cell_toolbar.activate_preset("Linker Extension References");
            Jupyter.notebook.metadata.celltoolbar = "Linker Extension References";
            
            $("#toggle_cell_references_bar > a")
                .text("Hide cell references toolbar");
            
            show_dataplot_input(true);
        } else {
            cell_toolbar.global_hide();
            delete Jupyter.notebook.metadata.celltoolbar;
            $("#toggle_cell_references_bar > a")
                .text("Show cell references toolbar");
            
            show_dataplot_input(false);
        }
    }
    
    //Show or hide input areas for dataplot cells.
    function show_input(show) {
        Jupyter.notebook.get_cells().forEach(function(cell){
        	if (dataplot.is_dataplot(cell) ||
        	    analysis.is_analysis(cell)) {
        		if (show) {
        			cell.element.find("div.input").show();
        		} else {
        			cell.element.find("div.input").hide();
        		}
        		
        	}
        });
    }
    
    //Insert a new dataplot cell
    var insert_dataplot_cell = function() {
    	console.log("Inserting new dataplot cell");
        
    	//Create the new cell
    	var index = Jupyter.notebook.get_selected_index() + 1;
    	var new_cell = Jupyter.notebook.insert_cell_at_index("code", index);

    	console.log("Number of cells: " + Jupyter.notebook.get_cells().length);
    	Jupyter.notebook.select(index, true);
    	new_cell.metadata.dataplot = true;
    	new_cell.metadata.hide_code = true;
    	new_cell.metadata.dataplot_files = [];
        new_cell.set_text("print('Please use the toolbar to generate an dataplot.');");
        new_cell.execute();
    	
        edit_dataplot_cell(new_cell);
    };
    
    var insert_analysis_cell = function() {
    	console.log("Inserting new analysis cell");
        
    	//Create the new cell
    	var index = Jupyter.notebook.get_selected_index() + 1;
    	var new_cell = Jupyter.notebook.insert_cell_at_index("code", index);

    	console.log("Number of cells: " + Jupyter.notebook.get_cells().length);
    	Jupyter.notebook.select(index, true);
    	new_cell.metadata.analysis = true;
    	new_cell.metadata.hide_code = true;
    	console.log("Setting analysis_variables to empty list");
    	new_cell.metadata.analysis_variables = [];
    	new_cell.metadata.analysis_files = [];
    	new_cell.set_text("print('Please use the toolbar to generate a script.');");
        new_cell.execute();
    	
        edit_analysis_cell(new_cell);
    };
    
    //Opens the edit toolbar for the current selected cell.
    var edit_current_cell = function() {
    	var cell = Jupyter.notebook.get_selected_cell();
    	if (dataplot.is_dataplot(cell)) {
        	edit_dataplot_cell(cell);
    	} else if (analysis.is_analysis(cell)) {
    		edit_analysis_cell(cell);
    	}
    };    
    
    function enable_dataplot_toolbar() {
    	cell_toolbar.global_show();
        cell_toolbar.activate_preset("Linker Extension Dataplot");
        Jupyter.notebook.metadata.celltoolbar = "Linker Extension Dataplot";
        
        var cells = Jupyter.notebook.get_cells(); 
        
        cells.forEach(function(cell){
        	cell.element.find("div.ctb_hideshow").removeClass("ctb_show");
        	if (dataplot.is_dataplot(cell)) {
        		cell.element.find("div.input").hide();
        	}
        });
    }
    
    function edit_dataplot_cell(cell){
    	enable_dataplot_toolbar();
        
        cell.element.find("div.ctb_hideshow").addClass("ctb_show");
        cell.element.find("div.input").show();
        
        if (cell.metadata.hide_code) {
        	cell.element.find("div.input_area").hide();
        } 
    }
    
    function enable_analysis_toolbar() {
    	cell_toolbar.global_show();
        cell_toolbar.activate_preset("Linker Extension Analysis");
        Jupyter.notebook.metadata.celltoolbar = "Linker Extension Analysis";
        
        var cells = Jupyter.notebook.get_cells(); 
        
        cells.forEach(function(cell){
        	cell.element.find("div.ctb_hideshow").removeClass("ctb_show");
        	if (analysis.is_analysis(cell)) {
        		cell.element.find("div.input").hide();
        	}
        });
    }
    
    function edit_analysis_cell(cell){
    	enable_analysis_toolbar();
        
        cell.element.find("div.ctb_hideshow").addClass("ctb_show");
        cell.element.find("div.input").show();
        
        if (cell.metadata.hide_code) {
        	cell.element.find("div.input_area").hide();
        } 
    }
   
    module.exports = {load: load};
});