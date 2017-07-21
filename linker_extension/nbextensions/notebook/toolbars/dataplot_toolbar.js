define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events",
    "./dataplot_code",
    "../local_data"
], function(Jupyter,
		    dialog,
		    events,
		    code,
		    local_data) {
"use strict";

	/*  
	 *  Generate the dataplot toolbar.
	 *  
	 *  Jupyter provides the div of the toolbar and the associated cell,
	 *  we just add all the required features.
	 */ 
	var dataplot_toolbar = function(div, cell) {
		$(div).addClass("generate-section dataplot-toolbar");
	    
		var cell_index = Jupyter.notebook.find_cell_index(cell);
		setup_title();
	    setup_file_input();
	    setup_details();
	    setup_generate();
		
		function setup_title() {
			//The title for the toolbar.
			var title_container = $("<div/>").addClass("generate-title")
	                                         .append("Generate dataplot cell");
	    	$(div).append(title_container);
	    }
	   
	    function setup_file_input() {
	        //Allows users to choose the datafile to be plotted.    	
	    	var input_container = $("<div/>").addClass("generate-code");
	    	
	    	var file_list = cell.metadata.dataplot_files;
	    	var onclick = function () {
	    		local_data.open_modal(file_list, $(".input-display"), "dataplot");
	    	}
	        var input_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                       .attr("id", "dataplot-input-" + cell_index)
	                                       .text("Input files")
	                                       .click(onclick);
	        var input_display = $("<span/>").addClass("input-display")
                                            .attr("id", "input-display-" + cell_index)
	                                        .text(local_data.get_display_text(file_list));
	        
	        input_container.append(input_button);
	        input_container.append(input_display);
	        
	        $(div).append(input_container);
	    }
	
		function update_metadata() {
		    cell.metadata.caption = $(".caption_" + cell_index).val();
		    cell.metadata.yaxis = $(".yaxis_" + cell_index).val();
		    cell.metadata.xaxis = $(".xaxis_" + cell_index).val();
		    cell.metadata.ymin = $(".ymin_" + cell_index).val();
		    cell.metadata.ymax = $(".ymax_" + cell_index).val();
		    cell.metadata.xmin = $(".xmin_" + cell_index).val();
		    cell.metadata.xmax = $(".xmax_" + cell_index).val();
		    
		}
	    
	    function setup_details() {
	    	//Customise labels for each axis.
			var yaxis_label = $("<p/>").text("y label:");
	    	var yaxis_input = $("<input/>").addClass("yaxis yaxis_" + cell_index)
			                               .attr("name","yaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.yaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var yaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("yaxis_div_" + cell_index)
			                           .append(yaxis_label)
			                           .append(yaxis_input);    
			
			var xaxis_label = $("<p/>").text("x label:");
		    var xaxis_input = $("<input/>").addClass("xaxis xaxis_" + cell_index)
			                               .attr("name","xaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.xaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var xaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("xaxis_div_" + cell_index)
			                           .append(xaxis_label)
			                           .append(xaxis_input);
			
			var ymin_label = $("<p/>").text("y minimum:");
	    	var ymin_input = $("<input/>").addClass("ymin ymin_" + cell_index)
			                               .attr("name","ymin")
			                               .change(update_metadata)
			                               .val(cell.metadata.ymin)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var ymin_div = $("<div/>").addClass("generate-values")
			                           .addClass("ymin_div_" + cell_index)
			                           .append(ymin_label)
			                           .append(ymin_input);   
			
			var xmin_label = $("<p/>").text("x minimum:");
	    	var xmin_input = $("<input/>").addClass("xmin xmin_" + cell_index)
			                               .attr("name","xmin")
			                               .change(update_metadata)
			                               .val(cell.metadata.xmin)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var xmin_div = $("<div/>").addClass("generate-values")
			                           .addClass("xmin_div_" + cell_index)
			                           .append(xmin_label)
			                           .append(xmin_input);   
			
			var ymax_label = $("<p/>").text("y maximum:");
	    	var ymax_input = $("<input/>").addClass("ymax ymax_" + cell_index)
			                               .attr("name","ymax")
			                               .change(update_metadata)
			                               .val(cell.metadata.ymax)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var ymax_div = $("<div/>").addClass("generate-values")
			                           .addClass("ymax_div_" + cell_index)
			                           .append(ymax_label)
			                           .append(ymax_input);   
			
			var xmax_label = $("<p/>").text("x maximum:");
	    	var xmax_input = $("<input/>").addClass("xmax xmax_" + cell_index)
			                               .attr("name","xmax")
			                               .change(update_metadata)
			                               .val(cell.metadata.xmax)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var xmax_div = $("<div/>").addClass("generate-values")
			                           .addClass("xmax_div_" + cell_index)
			                           .append(xmax_label)
			                           .append(xmax_input);   

			var caption_label = $("<p/>").text("Caption:");
	        var caption_input = $("<textarea/>").addClass("caption caption_" + cell_index)
	                                            .attr("name","caption")
                                                .change(update_metadata)
                                                .val(cell.metadata.caption)
                                                .focus(function(){Jupyter.keyboard_manager.edit_mode()});
	        var caption_div = $("<div/>").addClass("generate-values")
	                                     .addClass("caption_div_" + cell_index)
	                                     .append(caption_label)
	                                     .append(caption_input);    

			$(div).append(yaxis_div);
			$(div).append(xaxis_div);
			$(div).append(ymax_div);
			$(div).append(ymin_div);
			$(div).append(xmax_div);
			$(div).append(xmin_div);
			$(div).append(caption_div)
	    } 
	
	    function setup_generate() {
	    	//Button that generates and executes the code.
	    	var generate_dataplot = function() {
	    		update_metadata();
	    		var script = code.dataplot_script(cell.metadata.dataplot_files,
						                          cell.metadata.xaxis,
						                          cell.metadata.yaxis,
						                          cell.metadata.xmin,
						                          cell.metadata.xmax,
						                          cell.metadata.ymin,
						                          cell.metadata.ymax,
						                          cell.metadata.caption);
	    		cell.set_text(script);
	    		cell.execute();
	    		
	    		local_data.update_associated_data("dataplot");
	    	}
	    	
	        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                          .attr("id", "generate-plot-" + cell_index)
	                                          .text("Generate dataplot")
	                                          .click(generate_dataplot);
	        
	        var show_hide_code = function() {
	        	console.log("Show/hide button clicked for dataplot toolbar");
	        	cell.metadata.hide_code = !cell.metadata.hide_code;
	        	
	        	if (cell.metadata.hide_code) {
	        		console.log("Hiding code");
	        		cell.element.find("div.input_area").hide();
	        	} else {
	        		console.log("Showing code");
	        		cell.element.find("div.input_area").show();
	        	}
	        }
	        
	        var show_hide_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                           .attr("id", "show-hide-" + cell_index)
                                               .text("Show/hide code")
                                               .click(show_hide_code);
	        
	        var close = function() {
	        	cell.element.find("div.input").hide();
	        }

	        var close_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                           .attr("id", "close-toolbar-" + cell_index)
                                               .text("Close toolbar")
                                               .click(close);
	
	        var generate_container = $("<div/>").addClass("generate-code")
	                                            .append(generate_button)
	                                            .append(show_hide_button)
	                                            .append(close_button);
	        
	        $(div).append(generate_container);  
	    }    
	};
	
	//Is the cell a dataplot generator cell?
	var is_dataplot = function(cell) {
	    if (cell.metadata.dataplot === undefined) {
	        return false;
	    } else {
	        return cell.metadata.dataplot;
	    }
	};
	
	module.exports = {dataplot_toolbar: dataplot_toolbar,
			          is_dataplot: is_dataplot};
});