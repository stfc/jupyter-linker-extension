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
			var title_container = $("<div/>").addClass("toolbar-title")
	                                         .append("Generate Dataplot Cell");
	    	$(div).append(title_container);
	    }
	   
	    function setup_file_input() {
	        //Allows users to choose the datafile to be plotted.    	
	    	var input_container = $("<div/>").addClass("generate-values");
	    	var input_label = $("<label/>").attr("for","input-button")
                                           .addClass("fieldlabel")
                                           .addClass("section-label")
                                           .text("Dataset:");
	    	
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
	        
	        input_container.append(input_label)
	        input_container.append(input_button);
	        input_container.append(input_display);
	        
	        $(div).append(input_container);
	    }
	
		function update_metadata() {
		    cell.metadata.caption = $("#caption_" + cell_index).val();
		    cell.metadata.yaxis = $("#yaxis_" + cell_index).val();
		    cell.metadata.xaxis = $("#xaxis_" + cell_index).val();
		    cell.metadata.ymin = $("#ymin_" + cell_index).val();
		    cell.metadata.ymax = $("#ymax_" + cell_index).val();
		    cell.metadata.xmin = $("#xmin_" + cell_index).val();
		    cell.metadata.xmax = $("#xmax_" + cell_index).val();
		    
		}
	    
	    function setup_details() {
	    	//Customise labels for each axis.
	    	var y_label = $("<label/>").attr("for","y_section")
                                       .addClass("fieldlabel")
                                       .addClass("section-label")
                                       .text("Y Axis:");
	    	var y_div = $("<div/>").attr("id", "y_section").addClass("generate-values");
	    	var y_table = $("<table/>");
	    	
	        var y_label_container = $("<tr/>").attr("id","y-label-container");
	        var y_input_container = $("<tr/>").attr("id","y-input-container");
	    	
			var yaxis_label = $("<label/>").text("Label:").attr("for","yaxis_" + cell_index);
	    	var yaxis_input = $("<input/>").addClass("axis")
	    	                               .attr("id", "yaxis_" + cell_index)
			                               .attr("name","yaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.yaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			
			var ymin_label = $("<label/>").text("Minimum:").attr("for","ymin_" + cell_index);
	    	var ymin_input = $("<input/>").addClass("min")
	    	                              .attr("id", "ymin_" + cell_index)
			                              .attr("name","ymin")
			                              .change(update_metadata)
			                              .val(cell.metadata.ymin)
			                              .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			
			var ymax_label = $("<label/>").text("Maximum:").attr("for","ymax_" + cell_index);
	    	var ymax_input = $("<input/>").addClass("max")
			                              .attr("id", "ymax_" + cell_index)
	    	                              .attr("name","ymax")
			                              .change(update_metadata)
			                              .val(cell.metadata.ymax)
			                              .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			
	    	y_label_container.append($("<td>").append(yaxis_label))
	    	                 .append($("<td>").append(ymin_label))
	    	                 .append($("<td>").append(ymax_label));

			y_input_container.append($("<td>").append(yaxis_input))
			                 .append($("<td>").append(ymin_input))
			                 .append($("<td>").append(ymax_input));
			
			y_table.append(y_label_container).append(y_input_container);
			y_div.append(y_label).append(y_table);
			
	    	var x_label = $("<label/>").attr("for","x_section")
                                       .addClass("fieldlabel")
                                       .addClass("section-label")
                                       .text("X Axis:");
            var x_div = $("<div/>").attr("id", "x_section").addClass("generate-values");
            var x_table = $("<table/>");

            var x_label_container = $("<tr/>").attr("id","x-label-container");
            var x_input_container = $("<tr/>").attr("id","x-input-container");
			
			var xaxis_label = $("<label/>").text("Label:").attr("for","xaxis_" + cell_index);
		    var xaxis_input = $("<input/>").addClass("axis")
		                                   .attr("id", "xaxis_" + cell_index)
			                               .attr("name","xaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.xaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			

			var xmin_label = $("<label/>").text("Minimum:").attr("for","xmin_" + cell_index);
	    	var xmin_input = $("<input/>").addClass("min")
                                          .attr("id", "xmin_" + cell_index)
                                          .attr("name","xmin")
			                              .change(update_metadata)
			                              .val(cell.metadata.xmin)
			                              .focus(function(){Jupyter.keyboard_manager.edit_mode()});
					
			var xmax_label = $("<label/>").text("Maximum:").attr("for","xmax_" + cell_index);
	    	var xmax_input = $("<input/>").addClass("max")
	    	                              .attr("id", "xmax_" + cell_index)
			                              .attr("name","xmax")
			                              .change(update_metadata)
			                              .val(cell.metadata.xmax)
			                              .focus(function(){Jupyter.keyboard_manager.edit_mode()});

	    	x_label_container.append($("<td>").append(xaxis_label))
                             .append($("<td>").append(xmin_label))
                             .append($("<td>").append(xmax_label));
	    	
			x_input_container.append($("<td>").append(xaxis_input))
                             .append($("<td>").append(xmin_input))
                             .append($("<td>").append(xmax_input));
			
			x_table.append(x_label_container).append(x_input_container);
			x_div.append(x_label).append(x_table);
			
			var caption_label = $("<p/>").text("Caption:").addClass("section-label");
	        var caption_input = $("<textarea/>").addClass("caption")
	                                            .attr("id", "caption_" + cell_index)
	                                            .attr("name","caption")
                                                .change(update_metadata)
                                                .val(cell.metadata.caption)
                                                .focus(function(){Jupyter.keyboard_manager.edit_mode()});
	        var caption_div = $("<div/>").addClass("generate-values")
	                                     .addClass("caption_div_" + cell_index)
	                                     .append(caption_label)
	                                     .append(caption_input);    

			$(div).append(y_div);
			$(div).append(x_div);
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
                                               .text("Close")
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