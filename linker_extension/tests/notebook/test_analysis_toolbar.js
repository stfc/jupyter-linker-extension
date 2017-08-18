var screenshot_dir = "screenshots/analysis_toolbar/";

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the cell toolbar for generating a dataplot");

    var screenshot_index = 1;
    
    function take_screenshot(name, selector) {
    	var index_string = screenshot_index.toString();
        casper.then(function () {
        	var filename = screenshot_dir + index_string +
		               ". " + name + ".png";
        	if (selector == undefined) {
                casper.capture(filename);
        	} else {
        		casper.captureSelector(filename, selector);
        	}

        });
        
        screenshot_index++;
    }
    
    this.viewport(1024, 768);

    take_screenshot("open-notebook");
    
    //Check the toolbar exists
    this.then(function() {
        this.test.assertExists(
            "li[data-name=\"Linker%20Extension%20Analysis\"] > a",
            "Toolbar visible in toolbar menu"
        );
    });
    
    //Check the insert cell button exists
    var selector = "#insert_analysis_cell";
    this.waitForSelector(selector);
    this.then(function() {
        this.test.assertExists(selector, "Toolbar button exists");
    });
    
    var cell_count = this.evaluate(function () {
        return (Jupyter.notebook.get_cells().length);
    });
    
    this.then(function () {
    	this.test.assertEquals(cell_count, 1, "Only one cell exists");
    });
    
    //Try inserting a cell
    this.thenClick(selector);
    this.then(function() {
        selector = ".analysis-toolbar";
        this.waitForSelector(selector);
        this.test.assertExists(selector, "Toolbar exists");
        this.test.assertVisible(selector, "Toolbar is visible");
    });
    
    take_screenshot("button-clicked")
    
    
    this.waitFor(function() {
        return this.evaluate(function() {
        	return Jupyter.notebook.get_cells().length == 2;
        });
    });
    
    this.waitFor(function() {
        cell_count = this.evaluate(function () {
        	var cells = Jupyter.notebook.get_cells(); 	
            return (cells.length);
        });
        
        return true;
    });

    this.then(function () {
    	this.test.assertEquals(cell_count, 2, "New cell created");
    });
    
    this.thenClick("#show-hide-1");
    take_screenshot("hide-code");
    this.waitWhileVisible(".input_area");
    this.then(function() {
        this.test.assertNotVisible(".input_area", "Code is hidden");
    });
    
    this.thenClick("#show-hide-1");
    take_screenshot("show-code");
    this.waitUntilVisible(".input_area");
    this.then(function() {
        this.test.assertVisible(".input_area", "Code is shown");
    });
    
    //Select an input file
    this.thenClick("#analysis-input-1");
    this.waitForSelector("#select");
    
    this.waitForSelector("#files-loading-analysis");
    this.waitWhileVisible("#files-loading-analysis");
    
    this.then(function() {
        this.test.assertVisible("#data-form-analysis",
                               "Select file modal exists");
    });
    
    take_screenshot("click-file-select");
    
    this.thenEvaluate(function() {
        $("#file-tree-analysis li > a[title=\"data1.dat\"]").prev(".button.chk").click();
    });
    
    take_screenshot("files-clicked");
    
    this.waitForSelector("#select");
    this.thenClick("#select");
    
    this.waitFor(function() {
        return this.evaluate(function() {
        	files_text = $("#input-display-1").text();
        	console.log("Analysis display text is: " + files_text);
            return files_text != "No files selected";
        });
    });
    
    take_screenshot("files-chosen");

    this.then(function() {
    	var files_text = this.evaluate(function() {
    		return $("#input-display-1").text();
    	});
    	
    	this.test.assertEquals(files_text, "1 file selected", "Analysis files successfully uploaded");
    });
    
    //Define some variables
    this.thenClick("#edit-variables-1");
    this.waitForSelector("#select");
    this.waitUntilVisible("#variable-display-0");
    
    this.then(function() {
        this.test.assertVisible("#variable-display-0",
                                "Define variables modal exists");
    });
    
    take_screenshot("click-variable");
    
    this.then(function() {
        this.evaluate(function() {
        	$("#cell-title").val("Example tool");
        	$("#cell-desc").val("An example tool created for the unit test.");
            $("#variable-display-0").val("First variable");
            $("#variable-name-0").val("first_var");
            $("#variable-default-0").val("1234");
            $("#add-variable-button").click();
            $("#variable-display-1").val("Second variable");
            $("#variable-name-1").val("second_var");
            $("#variable-default-1").val("5678");
        });
    });
    
    take_screenshot("variables-set");
    this.thenClick("#select");

    this.waitUntilVisible("#variable-label-0");
    
    this.then(function() {
    	var variable_name_0 = this.evaluate(function() {
    		return $("#variable-label-0").text();
    	});
    	
    	var variable_name_1 = this.evaluate(function() {
    		return $("#variable-label-1").text();
    	});
    	
    	var title = this.evaluate(function() {
    		return $("#cell-title").val(); 
    	});
    	
    	var desc = this.evaluate(function() {
    		return $("#cell-desc").val(); 
    	});
    	
    	this.test.assertEquals(title, 
	                           "Example tool", 
	                           "Title correctly set");
    	this.test.assertEquals(desc, 
    			               "An example tool created for the unit test.", 
	                           "Description correctly set");
    	
    	this.test.assertEquals(variable_name_0, "First variable:", "First variable correctly created");
    	this.test.assertEquals(variable_name_1, "Second variable:", "Second variable correctly created");
    	this.test.assertDoesntExist("#variable-label-2", "No extra variables created");
    });
    
    //Test variables are successfully recreated
    this.thenClick("#edit-variables-1");
    this.waitForSelector("#select");
    this.waitUntilVisible("#variable-display-0"); 
    
    this.then(function() {
    	var variable_0 = this.evaluate(function() {
    		return {display: $("#variable-display-0").val(),
    			    name: $("#variable-name-0").val(),
    			    default_value: $("#variable-default-0").val()};     
    	});
    	
    	var variable_1 = this.evaluate(function() {
    		return {display: $("#variable-display-1").val(),
			    name: $("#variable-name-1").val(),
			    default_value: $("#variable-default-1").val()}; 
    	});
    	
    	var title = this.evaluate(function() {
    		return $("#cell-title").val(); 
    	});
    	
    	var desc = this.evaluate(function() {
    		return $("#cell-desc").val(); 
    	});
    	
    	this.test.assertEquals(title, 
	                           "Example tool", 
	                           "Title correctly reloaded");
    	this.test.assertEquals(desc, 
    			               "An example tool created for the unit test.", 
	                           "Description correctly reloaded");
    	this.test.assertEquals(variable_0.display, 
    			               "First variable", 
    			               "First variable display correctly reloaded");
    	this.test.assertEquals(variable_1.display, 
    			               "Second variable", 
    			               "Second variable display correctly reloaded");
    	this.test.assertEquals(variable_0.name, 
    			               "first_var", 
    			               "First variable name correctly reloaded");
    	this.test.assertEquals(variable_1.name, 
    			               "second_var", 
    			               "Second variable name correctly reloaded");
    	this.test.assertEquals(variable_0.default_value, 
    			               "1234", 
    			               "First variable default correctly reloaded");
    	this.test.assertEquals(variable_1.default_value, 
    			               "5678", 
    			               "Second variable default correctly reloaded");
    	
    	this.test.assertDoesntExist("#variable-display-2", 
    			                    "No extra variables created");
    });
    
    take_screenshot("variables-reloaded");
    this.thenClick("#select");
    
    this.waitUntilVisible("#variable-label-0");
    
    this.then(function() {
    	var variable_name_0 = this.evaluate(function() {
    		return $("#variable-label-0").text();
    	});
    	
    	var variable_name_1 = this.evaluate(function() {
    		return $("#variable-label-1").text();
    	});
    	
    	this.test.assertEquals(variable_name_0, "First variable:", "First variable correctly recreated");
    	this.test.assertEquals(variable_name_1, "Second variable:", "Second variable correctly recreated");
    	this.test.assertDoesntExist("#variable-label-2", "No extra variables created");
    });
    take_screenshot("variables-recreated");
    
    //Remove a variable
    this.thenClick("#edit-variables-1");
    this.waitForSelector("#select");
    this.waitForSelector("#variable-remove-0"); 
    
    this.wait(1000);  
    
    this.then(function() {
        this.evaluate(function() {
            $("#variable-remove-0").click();
        });
    });
     
    take_screenshot("variable-removed");
    this.thenClick("#select");
    
    this.waitUntilVisible("#variable-label-0");
    
    this.then(function() {    	
    	var variable_name_1 = this.evaluate(function() {
    		return $("#variable-label-0").text();
    	});
    	
    	this.test.assertEquals(variable_name_1, "Second variable:", "Remaining variable correctly recreated");
    	this.test.assertDoesntExist("#variable-label-1", "Variable label removed");
    	this.test.assertDoesntExist("#variable-input-1", "Variable input removed");
    });
    take_screenshot("variables-recreated");
    
    //Enter text, then create variables
    this.then(function() {
        this.evaluate(function() {
            $("#variable-input-0").val("test input");
        });
    });
    
    this.thenClick("#edit-variables-1");
    this.waitForSelector("#select");
    this.thenClick("#select");
    
    this.waitUntilVisible("#variable-label-0");
    
    this.then(function() {    	
    	var variable_name_1 = this.evaluate(function() {
    		return $("#variable-label-0").text();
    	});
    	
    	this.test.assertEquals(variable_name_1, "Second variable:", "First variable correctly recreated");
    	this.test.assertDoesntExist("#variable-label-1", "No more variables exist");
    });
    
    this.waitForSelector("#run-1");
    this.thenClick("#run-1");
    
    console.log("Getting text from cell");
    this.then(function() {
        var cell_text = this.evaluate(function() {
            return Jupyter.notebook.get_selected_cell().get_text();
        });
        
        this.test.assertNotEquals(cell_text.indexOf("second_var = '5678'"), -1, "Variable succesfully created");
        this.test.assertNotEquals(cell_text.indexOf("name = 'data1.dat'"), -1, "Datafile succesfully imported");
    });
});