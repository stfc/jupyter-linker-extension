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
	    	
	    	var open_input_modal = function() {
	    		var modal = dialog.modal({
		            title: "Input datafiles",
		            body: local_data.data_form(),
		            buttons: {
		                Cancel: {},
		                Select: { 
		                    class : "btn-primary",
		                    click: function() {
		                    	cell.metadata.dataplot_files = 
		                    		local_data.get_selected_values();
		                    	$(".input-display").text(get_display_text());
		                    	return true;
		                    },
		                }
		            },
		            notebook: Jupyter.notebook,
		            keyboard_manager: Jupyter.notebook.keyboard_manager,
		        });

		        modal.on("shown.bs.modal", function () {
		            local_data.init_data_form(cell.metadata.dataplot_files);
		        });
	    	}
	    	
	    	function get_display_text() {
	    		if (!cell.metadata.dataplot_files ||
	    	        cell.metadata.dataplot_files.length == 0) {
		    		return("No files selected");
		    	} else if (cell.metadata.dataplot_files.length == 1) {
		    		return("1 file selected");
		    	} else {
		    		return(cell.metadata.dataplot_files.length + " files selected");
		    	}
	    	}
	    	
	        var input_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                       .text("Input files")
	                                       .click(open_input_modal);
	        var input_display = $("<span/>").addClass("input-display")
	                                        .text(get_display_text());
	        
	        input_container.append(input_button);
	        input_container.append(input_display);
	        
	        $(div).append(input_container);
	        
	    }
	
	    function setup_details() {
	    	//Customise labels for each axis.
			var yaxis_label = $("<p/>").text("y label:");
	    	var yaxis_input = $("<input/>").addClass("yaxis yaxis_" + cell.cell_id)
			                               .attr("name","yaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.yaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var yaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("yaxis_div_" + cell.cell_id)
			                           .append(yaxis_label)
			                           .append(yaxis_input);    
			
			var xaxis_label = $("<p/>").text("x label:");
		    var xaxis_input = $("<input/>").addClass("xaxis xaxis_" + cell.cell_id)
			                               .attr("name","xaxis")
			                               .change(update_metadata)
			                               .val(cell.metadata.xaxis)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			var xaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("xaxis_div_" + cell.cell_id)
			                           .append(xaxis_label)
			                           .append(xaxis_input);

			var caption_label = $("<p/>").text("Caption:");
	        var caption_input = $("<textarea/>").addClass("caption caption_" + cell.cell_id)
	                                            .attr("name","caption")
                                                .change(update_metadata)
                                                .val(cell.metadata.caption)
                                                .focus(function(){Jupyter.keyboard_manager.edit_mode()});
	        var caption_div = $("<div/>").addClass("generate-values")
	                                     .addClass("caption_div_" + cell.cell_id)
	                                     .append(caption_label)
	                                     .append(caption_input);    
		
			function update_metadata() {
			    cell.metadata.caption = $(".caption_" + cell.cell_id).val();
			    cell.metadata.yaxis = $(".yaxis_" + cell.cell_id).val();
			    cell.metadata.xaxis = $(".xaxis_" + cell.cell_id).val();
			}
			
			$(div).append(yaxis_div);
			$(div).append(xaxis_div);
			$(div).append(caption_div)
	    } 
	
	    function setup_generate() {
	    	//Button that generates and executes the code.
	    	var generate_dataplot = function() {
	    		var script = code.dataplot_script(cell.metadata.dataplot_files,
						                          cell.metadata.xaxis,
						                          cell.metadata.yaxis,
						                          cell.metadata.caption);
	    		cell.set_text(script);
	    		cell.execute();
	    		
	    		local_data.update_associated_data();
	    	}
	    	
	        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                          .text("Generate dataplot")
	                                          .click(generate_dataplot);
	        
	        var show_hide_code = function() {
	        	cell.metadata.hide_code = !cell.metadata.hide_code;
	        	
	        	if (cell.metadata.hide_code) {
	        		cell.element.find("div.input_area").hide();
	        	} else {
	        		cell.element.find("div.input_area").show();
	        	}
	        }
	        
	        var show_hide_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                               .text("Show/hide code")
                                               .click(show_hide_code);
	        
	        var close = function() {
	        	cell.element.find("div.input").hide();
	        }

	        var close_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
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