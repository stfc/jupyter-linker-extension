define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events",
    "./dataplot_code"
], function(Jupyter,dialog,events,code) {
"use strict";

	/*  
	 *  Generate the dataplot toolbar.
	 *  
	 *  Jupyter provides the div of the toolbar and the associated cell,
	 *  we just add all the required features.
	 */ 
	var dataplot_toolbar = function(div, cell) {
		$(div).addClass("generate-section");
	    setup_title();
	    setup_file_input();
	    setup_axis();
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
	    			
	        var find_file = $("<input>").text("Find file")
	        							.attr("type","file")
	                                    .attr("id","find_file")
	                                    .attr("required","required")
	                                    .attr("name","find_file[]");
	        
	        find_file.change(function() {
	            var label = $(this).val().replace(/\\/g, "/").replace(/.*\//, "");
	            $(this).trigger("fileselect", [label]);
	        });
	
	        find_file.on("fileselect", function(event, label) {
	            cell.metadata.inputfile = label;
	        });
	
	        input_container.append(find_file);
	        
	        $(div).append(input_container);
	        
	    }
	
	    function setup_axis() {
	    	//Customise labels for each axis.
	        var xaxis_input = $("<input/>").addClass("xaxis xaxis_" + cell.cell_id)
			                               .attr("name","xaxis")
			                               .change(update_metadata)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			
			var xaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("xaxis_div_" + cell.cell_id)
			                           .append("x axis label:")
			                           .append(xaxis_input);
			
			var yaxis_input = $("<input/>").addClass("yaxis yaxis_" + cell.cell_id)
			                               .attr("name","yaxis")
			                               .change(update_metadata)
			                               .focus(function(){Jupyter.keyboard_manager.edit_mode()});
			
			var yaxis_div = $("<div/>").addClass("generate-values")
			                           .addClass("yaxis_div_" + cell.cell_id)
			                           .append("y axis label:")
			                           .append(yaxis_input);        
			
			function update_metadata() {
			    cell.metadata.yaxis = $(".yaxis_" + cell.cell_id).val();
			    cell.metadata.xaxis = $(".xaxis_" + cell.cell_id).val();
			}
			
			$(div).append(xaxis_div);
	        $(div).append(yaxis_div);
	    }
	
	    function setup_generate() {
	    	//Button that generates and executes the code.
	    	var generate_dataplot = function() {
	    		var script = code.dataplot_script(cell.metadata.inputfile,
						                          cell.metadata.xaxis,
						                          cell.metadata.yaxis);
	    		cell.set_text(script);
	    		cell.execute();
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
	
	
	var generate_dataplot = function(cell) {
		var script = code.dataplot_script(cell.metadata.inputfile,
										  cell.metadata.xaxis,
										  cell.metadata.yaxis);
		cell.set_text(script);
	    cell.execute();
	}
	
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