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
	var analysis_toolbar = function(div, cell) {
		if (cell != Jupyter.notebook.get_selected_cell()) {
			return;
		}
		
		$(div).addClass("generate-section analysis-toolbar");
	    
		var cell_index = Jupyter.notebook.find_cell_index(cell);
		setup_title();
	    setup_file_input();
	    setup_variables();
	    setup_generate();
		
		function setup_title() {
			//The title for the toolbar.
			var title_container = $("<div/>").addClass("generate-title")
	                                         .append("Generate Analysis Cell");
	    	$(div).append(title_container);
	    }
	   
	    function setup_file_input() {
	        //Allows users to choose the datafile to be plotted.    	
	    	var input_container = $("<div/>").addClass("generate-values");
	    	var input_label = $("<label/>").attr("for","input-button")
                                           .addClass("fieldlabel")
                                           .addClass("section-label")
                                           .text("Dataset:");
	    	
	    	var file_list = cell.metadata.analysis_files;
	    	var onclick = function () {
	    		local_data.open_modal(file_list, $(".input-display"), "analysis");
	    	}
	    	
	        var input_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                       .attr("id", "analysis-input-" + cell_index)
	                                       .text("Input files")
	                                       .click(onclick);
	        var input_display = $("<span/>").addClass("input-display")
                                            .attr("id", "input-display-" + cell_index)
	                                        .text(local_data.get_display_text(file_list));
	        
	        input_container.append(input_label);
	        input_container.append(input_button);
	        input_container.append(input_display);
	        
	        $(div).append(input_container);
	    }
	
	    function setup_variables() {
	    	console.log("Setting up variables for cell " + cell_index);
	    	var variables = $("<div/>").addClass("generate-values");
	    	var variables_table = $("<table/>").addClass("variable-table").attr("id", "variable-list-" + cell_index);
	    	var variables_label = $("<label/>").addClass("fieldlabel")
                                               .addClass("section-label")
                                               .text("Variables:");

	    	variables.append(variables_label).append(variables_table);
	    	
	    	$(div).append(variables);
	    	var empty_message = $("<span/>").addClass("empty-message")
		                                    .attr("id", "empty-variable-message")
		                                    .text("No variables defined. Please click the 'edit variables' button to add some.");
			        
			variables_table.append(empty_message);
	    	if (cell.metadata.analysis_variables != undefined) {
	    		update_variables(variables_table);
	    	} 	
	    }
	    
	    var variable_index = 0;
	    
		function update_variables(variables_table) {
			console.log("Updating variables for cell " + cell_index);
			var variables_to_create = cell.metadata.analysis_variables.slice();
			var variable_count = 0;

			$(".cell-" + cell_index + "-variable").each(function(index,item) {
				var display_name = $(item).text().trim();
				var name = display_name.substring(0, display_name.length - 1);
				
				console.log("Found exisiting variable: " + name);
				
				if (variables_to_create.indexOf(name) == -1) {
					console.log(name + " should no longer exist, removing");
					$(item).parent().parent().remove()
				} else {
					console.log("Field already exists for " + name);
					variables_to_create.splice(variables_to_create.indexOf(name), 1);
					variable_count++;
				}			
			});
			
			for (var i = 0; i < variables_to_create.length; i++) { 
				var variable = variables_to_create[i];
				console.log("Adding container for " + variable);
				var container = $("<tr/>");
				var label = $("<label/>").text(variable + ":")
				                         .addClass("variable")
				                         .addClass("cell-" + cell_index + "-variable")
				                         .attr("id", "variable-label-" + variable_index);
				container.append($("<td/>").append(label));
				
				var input =  $("<input/>").attr("type","text")
	                                      .attr("id", "variable-input-" + variable_index);
				variable_count++;
				variable_index++;
				container.append($("<td/>").append(input));
	            
				variables_table.append(container);
			}
			
			if (variable_count > 0) {
				if ($("#empty-variable-message").is(":visible")) {
					console.log("Hiding empty message");
					$("#empty-variable-message").hide();
				}
			} else {
				if (!$("#empty-variable-message").is(":visible")) {
					console.log("Showing empty message");
					$("#empty-variable-message").show();
				}
			}
		}
		
		function select_variables() {
			console.log("Selecting variables for cell " + cell_index);
			var form_body = function () {
		        var label = $("<label/>").text("Choose variables for use in analysis script.");
			
			    var variables = $("<div/>").attr("id", "variables")
			                                   .addClass("download-page");

	            var variable_container = $("<div/>").addClass("variable-container");

		        var add_variable_button = $("<button/>")
		            .addClass("btn btn-xs btn-default btn-add add-variable-button")
		            .attr("id","add-variable-button")
		            .attr("type","button")
		            .attr("aria-label","Add variable")
		            .click(function() {
		                addVariable("");
		            });
	
		        add_variable_button.append($("<i>").addClass("fa fa-plus"));
	
		        variables.append(label).append(variable_container);
	
		        var variable_count = 0;
		        var last_variable;
		        function addVariable(variable_name) {
		            var new_variable_container = $("<div/>").addClass("variable-container");
		            var new_variable = $("<input/>")
		                .attr("class","variable-input")
		                .attr("type","text")
		                .attr("id","variable-" + variable_count);
	
		            new_variable.val(variable_name);
	                 
		            if (last_variable != undefined) {
		            	var variable_id = variable_count - 1;
			            var delete_variable = $("<button/>")
			                .addClass("btn btn-xs btn-default btn-remove remove-variable-button")
			                .attr("type","button")
			                .attr("id", "variable-remove-" + variable_id)
			                .attr("aria-label","Remove variable")
			                .click(function() {
			                	console.log("Removing variable " + variable_id);
			                    $(this).parent().remove();
			                });
		
			            delete_variable.append($("<i>")
			                             .addClass("fa fa-trash")
			                             .attr("aria-hidden","true"));
			            last_variable.append(delete_variable);
		            }

		            add_variable_button.detach(); 
		            variables.append(new_variable_container.append(new_variable).append(add_variable_button));
		            variable_count++;
		            last_variable = new_variable_container;
		            return;
		        }
		        
		        if (cell.metadata.analysis_variables == undefined ||
		            cell.metadata.analysis_variables.length == 0) {
		        	addVariable("");
		        } else {
		        	console.log("Found " + cell.metadata.analysis_variables.length + " existing variables");
		        	for (var i = 0; i < cell.metadata.analysis_variables.length; i++) {
			        	addVariable(cell.metadata.analysis_variables[i]);
			        }
		        }
		        
		        return variables;
			};
			
			var submit = function () {
				cell.metadata.analysis_variables = [];
				
				$(".variable-input").each(function(index,item) {
					if ($(item).val().trim() != "") {
						console.log("Variable for analysis toolbar: " + $(item).val().trim());
						cell.metadata.analysis_variables.push($(item).val().trim());
					}
				});
				
				update_variables($("#variable-list-" + cell_index));
			};
			
	        var modal = dialog.modal({
	            title: "Add variables to be used in the analysis tool",
	            body: form_body(),
	            buttons: {
	                Cancel: {},
	                Select: { 
	                    class : "btn-primary",
	                    click: submit,
	                    id: "select"
	                }
	            },
	            notebook: Jupyter.notebook,
	            keyboard_manager: Jupyter.notebook.keyboard_manager,
	        });

		}
	
	    function setup_generate() {
	    	//Button that generates and executes the code.
	        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                          .attr("id", "generate-" + cell_index)
	                                          .text("Generate");
	        
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
	        
	        var variables_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                               .attr("id", "edit-variables-" + cell_index)
                                               .text("Edit Variables")
                                               .click(select_variables);
	        
	        var close = function() {
	        	cell.element.find("div.input").hide();
	        }

	        var close_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                           .attr("id", "close-toolbar-" + cell_index)
                                               .text("Close toolbar")
                                               .click(close);
	
	        var generate_container = $("<div/>").addClass("generate-code")
	                                            .append(generate_button)
	                                            .append(variables_button)
	                                            .append(show_hide_button)
	                                            .append(close_button);
	        
	        $(div).append(generate_container);  
	    }    
	};
	
	//Is the cell a dataplot generator cell?
	var is_analysis = function(cell) {
	    if (cell.metadata.analysis === undefined) {
	        return false;
	    } else {
	        return cell.metadata.analysis;
	    }
	};
	
	module.exports = {analysis_toolbar: analysis_toolbar,
			          is_analysis: is_analysis};
});