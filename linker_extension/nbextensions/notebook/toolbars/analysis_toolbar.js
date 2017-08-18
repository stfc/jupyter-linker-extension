define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events",
    "./analysis_code",
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
		
	    var title_container;
	    var desc_container;
		function setup_title() {
			//The title for the toolbar.
			title_container = $("<div/>").addClass("toolbar-title")
			                             .attr("id", "cell-title")
	                                     .append("Analysis Cell");
	    	$(div).append(title_container);
	    	
			desc_container = $("<div/>").addClass("toolbar-desc")
                                        .attr("id", "cell-desc")
                                        .append("Click on 'edit' to create a custom analysis cell.");
		    $(div).append(desc_container);
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
	
	    var empty_message;
	    var variables_table;
	    function setup_variables() {
	    	console.log("Setting up variables for cell " + cell_index);
	    	var variables = $("<div/>").addClass("generate-values");
	    	variables_table = $("<table/>").addClass("variable-table").attr("id", "variable-list-" + cell_index);
	    	var variables_label = $("<label/>").addClass("fieldlabel")
                                               .addClass("section-label")
                                               .text("Variables:");

	    	$(div).append(variables);
	    	empty_message = $("<span/>").addClass("empty-message")
		                                .attr("id", "empty-variable-message")
		                                .text("No variables defined. Use the 'edit' button to define the interface for this cell.");
			        
	    	variables.append(variables_label)
	    	         .append(empty_message)
	    	         .append(variables_table);
			
	    	update_display(); 	
	    }
	    
		function update_display() {
			if (cell.metadata.analysis_title != undefined) {
				if (cell.metadata.analysis_title.trim() == "") {
					title_container.text("Analysis Cell");
				} else {
					title_container.text(cell.metadata.analysis_title.trim());
				}
			}
			
			if (cell.metadata.analysis_desc != undefined) {
				if (cell.metadata.analysis_desc.trim() == "") {
					desc_container.text("Click on 'edit' to create a custom analysis cell.");
				} else {
					desc_container.text(cell.metadata.analysis_desc.trim());
				}
			}
			
			if (cell.metadata.analysis_variables != undefined) {
				console.log("Updating variables for cell " + cell_index);
				var variables_to_create = cell.metadata.analysis_variables.slice();
				
				$(".cell-" + cell_index + "-row").each(function(index,item) {
					$(item).remove();
				});
				
				var variable_count = 0;
				for (var i = 0; i < variables_to_create.length; i++) { 
					var variable = variables_to_create[i];
					variable.index = variable_count;
					console.log("Adding container for " + variable.display);
					var container = $("<tr/>").addClass("cell-" + cell_index + "-row");
					var label = $("<label/>").text(variable.display + ":")
					                         .addClass("variable")
					                         .addClass("cell-" + cell_index + "-variable")
					                         .attr("id", "variable-label-" + variable.index);
					container.append($("<td/>").append(label));
					
					var input =  $("<input/>").attr("type","text")
		                                      .attr("id", "variable-input-" + variable.index)
		                                      .addClass("variable-input")
					                          .addClass("cell-" + cell_index + "-variable-input")
					                          .val(variable.default_value)
		                                      .focus(function(){Jupyter.keyboard_manager.edit_mode()});
					
					for (var j = 0; j < cell.metadata.analysis_variables.length; j++) {
						if (cell.metadata.analysis_variables[j].name == variable.name) {
							cell.metadata.analysis_variables[j].index = variable.index;
						}
					}
					
					variable_count++;
					container.append($("<td/>").append(input));
		            
					variables_table.append(container);			
				}
				
				if (variable_count > 0) {
					empty_message.hide();
				} else {
					empty_message.show();
				}
			}
		}
		
		function select_variables() {
			console.log("Selecting variables for cell " + cell_index);
			
			var variable_table = function () {
		        var label =  $("<label/>").attr("for","variables")
	                                                .addClass("fieldlabel")
	                                                .text("Variables: ");
				
			    var variables = $("<div/>").attr("id", "variables");

			    var table = $("<table/>").addClass("variable-def-table")
			                             .attr("id", "variable-def-table-" + cell_index);
			    
			    var label_container = $("<tr/>");
			    table.append(label_container);
			    
			    var display_label = $("<label/>").text("Display name:")
			    								 .attr("class","variable-field");
                label_container.append($("<td/>").append(display_label));
			    
                var name_label = $("<label/>").text("Variable name:")
				                              .attr("class","variable-field");
                label_container.append($("<td/>").append(name_label));
                
                var default_label = $("<label/>").text("Default value:")
				                                 .attr("class","variable-field");
                label_container.append($("<td/>").append(default_label));
                
                //Empty column- used for the add/remove button
                label_container.append($("<td/>"));
                
                variables.append(label).append(table);
               
		        var add_variable_button = $("<button/>")
		            .addClass("btn btn-xs btn-default btn-add add-variable-button")
		            .attr("id","add-variable-button")
		            .attr("type","button")
		            .attr("aria-label","Add variable")
		            .click(function() {
		                addVariable();
		            })
	                .append($("<i>").addClass("fa fa-plus"));
	                
                
		        var variable_count = 0;
		        var previous_button;
		        function addVariable(variable) {
		        	if (variable == undefined) {
		        		variable = {display: "", name: "", default_value:""};
		        	} 
		            var row = $("<tr/>").addClass("variable-define");
		            var display = $("<input/>")
		                .attr("class","variable-field var-display")
		                .attr("type","text")
		                .attr("id","variable-display-" + variable_count);
		            row.append($("<td/>").append(display));
		            
		            var name = $("<input/>")
	                    .attr("class","variable-field var-name")
	                    .attr("type","text")
	                    .attr("id","variable-name-" + variable_count);
		            row.append($("<td/>").append(name));
		            
		            var def = $("<input/>")
	                    .attr("class","variable-field var-def")
	                    .attr("type","text")
	                    .attr("id","variable-default-" + variable_count);
		            row.append($("<td/>").append(def));
		            
		            display.val(variable.display);
		            name.val(variable.name);
		            def.val(variable.default_value);
		            
                    add_variable_button.detach();
                    
                    var button = $("<td/>");
                    row.append(button)
		            
		            button.append(add_variable_button);
		            
		            if (previous_button != undefined) {
		            	var variable_id = variable_count - 1;
			            var delete_variable = $("<button/>")
			                .addClass("btn btn-xs btn-default btn-remove remove-variable-button")
			                .attr("type","button")
			                .attr("id", "variable-remove-" + variable_id)
			                .attr("aria-label","Remove variable")
			                .click(function() {
			                	console.log("Removing variable " + variable_id);
			                    $(this).parent().parent().remove();
			                });
		
			            delete_variable.append($("<i>")
			                             .addClass("fa fa-trash")
			                             .attr("aria-hidden","true"));
			            previous_button.append(delete_variable);
		            }

		            table.append(row);
		            variable_count++;
		            previous_button = button;
		            return;
		        }
		        
		        if (cell.metadata.analysis_variables == undefined ||
		            cell.metadata.analysis_variables.length == 0) {
		        	addVariable();
		        } else {
		        	console.log("Found " + cell.metadata.analysis_variables.length + " existing variables");
		        	for (var i = 0; i < cell.metadata.analysis_variables.length; i++) {
			        	addVariable(cell.metadata.analysis_variables[i]);
			        }
		        }
		        
		        return variables;
			};
			
	        var title = $("<input/>").attr("name","cell-title")
                                     .attr("id","cell-title")
                                     .addClass("title-input")
                                     .attr("type","text");
	        
	        var desc = $("<textarea/>").attr("name","cell-desc")
                                       .attr("id","cell-desc")
                                       .addClass("desc-input")
                                       .attr("type","text");
			
			var form_body = function () {
			    var edit_toolbar_body = $("<div/>").attr("id", "edit-toolbar")
                                                   .addClass("download-page");
			    
				var title_div = $("<div/>");
				
		        var title_label =  $("<label/>")
		            .attr("for","cell-title")
		            .addClass("required")
		            .addClass("fieldlabel")
		            .text("Cell Title: ");
		        
		        if (cell.metadata.analysis_title != undefined) {
		        	title.val(cell.metadata.analysis_title);
		        }
		        
		        title_div.append(title_label);
		        title_div.append(title);
		        edit_toolbar_body.append(title_div);
		        
				var desc_div = $("<div/>");
				
		        var desc_label =  $("<label/>")
		            .attr("for","cell-desc")
		            .addClass("required")
		            .addClass("fieldlabel")
		            .text("Cell Description: ");
		        
		        if (cell.metadata.analysis_desc != undefined) {
		        	desc.val(cell.metadata.analysis_desc);
		        }
		        
		        desc_div.append(desc_label);
		        desc_div.append(desc);
		        edit_toolbar_body.append(desc_div);
		        
		        edit_toolbar_body.append(variable_table());
		        
		        return (edit_toolbar_body);
			};
			
			var submit = function () {
				cell.metadata.analysis_variables = [];
				
				$(".variable-define").each(function(index,item) {
					var new_variable = {};
					
					var display = $(item).find(".var-display");
					var name = $(item).find(".var-name");
					var def = $(item).find(".var-def");
					
					var new_variable = {display: display.val().trim(),
							            name: name.val().trim(),
							            default_value: def.val()};
					
					if (new_variable.display != "" &&
						new_variable.name != "") {
						console.log("Variable for analysis toolbar: " + display.val());
						cell.metadata.analysis_variables.push(new_variable);
					}

				});
				
				cell.metadata.analysis_title = title.val().trim();
				cell.metadata.analysis_desc = desc.val().trim();
				update_display();
			};
			
	        var modal = dialog.modal({
	            title: "Edit Interface for Analysis Toolbar",
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
	
		function generate_code() {
    		console.log("Generating code for cell " + cell_index)
    		var variables = [];
    		var labels = [];
    		var values = [];
    		
    		for (var i = 0; i < cell.metadata.analysis_variables.length; i++) {
    			var variable = cell.metadata.analysis_variables[i];
    			console.log("Variable to generate: " + variable.name);
    			var to_upload = {};
    			
    			to_upload.name = variable.name;
    			console.log("Getting value from #variable-input-" + variable.index);
    			to_upload.value = $("#variable-input-" + variable.index).val().trim();
    			console.log(to_upload.name + " has value " + to_upload.value);
    			
    			variables.push(to_upload);
    		}
    		
    		var script = code.analysis_script(cell.metadata.analysis_files,
					                          variables);
    		
    		var current_text = cell.get_text();
    		
    		var end_marker = "#Begin user script\n";
    		if (current_text.indexOf(end_marker) != -1) {
    			var split_text = current_text.split(end_marker);
    			current_text = split_text[1];
    		}
    		
    		cell.set_text(script + current_text);
    		cell.execute();
    		
    		local_data.update_associated_data("analysis");
		}
		
	    function setup_generate() {
	    	//Button that generates and executes the code.
	        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
	                                          .attr("id", "run-" + cell_index)
	                                          .click(generate_code)
	                                          .text("Run");
	        
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
                                               .text("Edit")
                                               .click(select_variables);
	        
	        var close = function() {
	        	cell.element.find("div.input").hide();
	        }

	        var close_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                           .attr("id", "close-toolbar-" + cell_index)
                                               .text("Close")
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