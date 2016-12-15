


casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing uploading notebook to DSpace");

    this.viewport(1024, 768);

    //check the empty reference cell works
    this.waitForSelector("#generate_references");
    this.thenClick("#generate_references");

    this.then(function() {
    	this.test.assertExists(".alert","Warning alert telling user there are no references exists");
    });

    //put in some references
    this.waitForSelector("#toggle_cell_references_bar");
    this.thenClick("#toggle_cell_references_bar");

    this.then(function() {
    	this.sendKeys(".referenceURL","https://cell-url.com/");
    });

    this.thenEvaluate(function () {
        require(['base/js/events'], function (events) {
            var md = Jupyter.notebook.metadata;
            md.reportmetadata = {
                "referencedBy": [
                  "https://www.metadata-url.com/",
                  "https://cell-url.com/", //include this to check that we don't get repeats
                ]
            };
        });
    });

    //we test that databundle_url exists after upload in upload_bundle_to_dspace.js, so here we're just gonna set it manually
    this.thenEvaluate(function () {
        Jupyter.notebook.metadata.databundle_url = "https://databundle-url.com/";
    });


    //actually generate the references
    this.waitForSelector("#generate_references");
    this.thenClick("#generate_references");

    this.then(function() {
    	var ref_cell_exist = this.evaluate(function() {
    		var cells = Jupyter.notebook.get_cells();

			for(var i = 0; i < cells.length; i++) {
				if(cells[i].metadata.reference_cell === true) {
					return true;
				}
			}
    	});

    	this.test.assert(ref_cell_exist,"Reference cell exists");

    	var ref_cell_count = this.evaluate(function() {
    		var cells = Jupyter.notebook.get_cells();

    		var return_val = 0;

			for(var i = 0; i < cells.length; i++) {
				if(cells[i].metadata.reference_cell === true) {
					return_val += 1;
				}
			}
			return return_val;
    	});

    	this.test.assertEquals(ref_cell_count,1,"Only one reference cell exists");

    	var ref_cell_text = this.evaluate(function() {
    		var ref_cell = Jupyter.notebook.get_cell(1); //should only have the original cell and our new one - ergo index 1
    		return ref_cell.get_text();
    	});

    	this.test.assertEquals(ref_cell_text,"## References\n<https://databundle-url.com/>\n\n<https://www.metadata-url.com/>\n\n<https://cell-url.com/>\n\n", "Reference cell text is correct");
    });
});