casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the cell toolbar for generating a dataplot");

    this.viewport(1024, 768);

    //Check the toolbar exists
    this.then(function() {
        this.test.assertExists(
            "li[data-name=\"Linker%20Extension%20Dataplot\"] > a",
            "Toolbar visible in toolbar menu"
        );
    });
    
    //Check the insert cell button exists
    var selector = "#insert_dataplot_cell";
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
        selector = ".dataplot-toolbar";
        this.waitForSelector(selector);
        this.test.assertExists(selector, "Toolbar exists");
    });
    
    cell_count = this.evaluate(function () {
        return (Jupyter.notebook.get_cells().length);
    });
    
    this.then(function () {
    	this.test.assertEquals(cell_count, 2, "New cell created");
    });
    
    


});