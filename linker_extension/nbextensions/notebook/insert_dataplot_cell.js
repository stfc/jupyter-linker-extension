define([
    "base/js/namespace",
    "base/js/utils",
    "notebook/js/celltoolbar",
    "../custom_utils",
    "./modify_notebook_html"
],function(Jupyter,
		   utils,
		   celltoolbar,
		   custom_utils){

    /*  
     *  Generate a reference cell at the bottom of the notebook that creates
     *  links defined in various places (any citations in the nb metadata,
     *  links from cells and if a databundle has been uploaded then that too)
     */ 
    var insert_dataplot_cell = function() {
    	console.log("Inserting new dataplot cell")
        
    	//Create the new cell
    	var index = Jupyter.notebook.get_selected_index();
    	var new_cell = Jupyter.notebook.insert_cell_at_index("code", index);
    	Jupyter.notebook.select(index, true);
    	new_cell.metadata.dataplot = true;
        
    	//Setup the toolbars
    	var CellToolbar = celltoolbar.CellToolbar;
    	CellToolbar.global_show();
        CellToolbar.activate_preset("Linker Extension Dataplot");
        Jupyter.notebook.metadata.celltoolbar = "Linker Extension Dataplot";
        
        var cells = Jupyter.notebook.get_cells(); 
        
        cells.forEach(function(cell){
        	cell.element.find("div.ctb_hideshow").removeClass("ctb_show");
        	if (cell.metadata.dataplot !== undefined && cell.metadata.dataplot) {
        		cell.element.find("div.input").hide();
            }
        });
        
        new_cell.element.find("div.ctb_hideshow").addClass("ctb_show");
        new_cell.element.find("div.input").show();
        new_cell.element.find("div.input_area").hide();
        new_cell.set_text("print('Please use the toolbar to generate an dataplot.');");
        new_cell.execute();
    };

    /*  
     *  Register action and create button etc.
     */ 
    var action = {
        help: "Insert dataplot cells",
        help_index: "f",
        icon: "fa-quote-right",
        handler : insert_dataplot_cell,
    };

    var prefix = "linker_extension";
    var action_name = "insert-dataplot-cell";
    
    var load = function () {
        Jupyter.notebook.keyboard_manager.actions.register(action,action_name,prefix);
        $("#insert_dataplot_cell").click(function () {
            insert_dataplot_cell();
        });
    };

    module.exports = {load: load};
});