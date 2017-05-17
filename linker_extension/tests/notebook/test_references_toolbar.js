casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the cell toolbar for adding cell references");

    this.viewport(1024, 768);

    //add an extra cell
    var selector = "#insert_above_below > button"; //add extra cell
    this.waitForSelector(selector);
    this.thenClick(selector);

    //check that menu item exists
    this.then(function() {
        this.test.assertExists(
            "li[data-name=\"Linker%20Extension\"] > a",
            "Toolbar visible in toolbar menu"
        );
    });

    //click the toggle button
    selector = "#toggle_cell_references_bar";
    this.waitForSelector(selector);
    this.then(function() {
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        this.test.assertEquals(
            text,
            "Show cell references toolbar",
            "Toggle button says show when it is not visible"
        );
    });
    this.thenClick(selector);

    //test that toggle on works
    this.then(function() {
        selector = ".cell-urls-container";
        //check we have our toolbar active
        this.test.assertExists(selector, "Our cell toolbar instance exists");
        this.test.assertElementCount(
            selector,
            2,
            "There are 2 instances of the toolbar - one for each cell"
        );
        this.test.assertVisible(
            selector,
            "At least one cell toolbars is visible"
        ); //this should mean that all are visible

        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        this.test.assertEquals(
            text,
            "Hide cell references toolbar",
            "Toggle button says hide when it is visible"
        );
    });

    //test that toggle off works 
    this.thenClick(selector);
    this.then(function() {
        selector = ".cell-urls-container";
        this.test.assertNotVisible(
            selector,
            "Cell toolbar has been toggled off successfully"
        );
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        this.test.assertEquals(
            text,
            "Show cell references toolbar",
            "Toggle button says show when it isn't visible"
        );
    });

    this.thenClick(selector);

    selector = ".cell";
    this.thenClick(selector); //click on first cell again

    this.thenEvaluate(function() {
        //matches the first cell's first input box
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(1) > input").val("URL1");
        //have to manually trigger change event
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(1) > input").change();
       
        //matches first cell's add url button
        $(".cell-urls:eq(0) .add-cell-url-button").click();

        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(2) > input").val("URL2");
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(2) > input").change();

        $(".cell-urls:eq(0) .add-cell-url-button").click();
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(3) > input").val("URL3");
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(3) > input").change();

        $(".cell-urls:eq(0) .add-cell-url-button").click();
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").val("URL4");
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").change();

        $(".cell-urls:eq(0) .add-cell-url-button").click();

        //matches the second cell's first input box
        $(".cell-urls:eq(1) > .referenceURL_div:nth-child(1) > input").val("URL5");
        $(".cell-urls:eq(1) > .referenceURL_div:nth-child(1) > input").change();

        //matches second cell's add url button
        $(".cell-urls:eq(1) .add-cell-url-button").click();
        $(".cell-urls:eq(1) > .referenceURL_div:nth-child(2) > input").val("URL6");
        $(".cell-urls:eq(1) > .referenceURL_div:nth-child(2) > input").change();

    });

    //check the cell metadata using edit metadata
    selector = "li[data-name=\"Edit%20Metadata\"] > a";
    this.thenClick(selector);
    this.then(function() {
        this.capture("screenshots/cellt.png");
    });

    selector = ".cell:nth-of-type(1) .celltoolbar > .button_container > button";
    this.thenClick(selector);

    this.waitForSelector(".modal-body");

    this.then(function() {
        var md = this.evaluate(function() {
            var raw_md = $("textarea[name=\"metadata\"]").val();
            var md = JSON.parse(raw_md);
            return md;
        });

        var urls = md.referenceURLs;
        this.test.assertEquals(
            urls,
            ["URL1","URL2","URL3","URL4"],
            "Cell 1 metadata successfully saved"
        );
    });

    selector = "button.close";
    this.thenClick(selector);

    this.waitWhileSelector(".modal");

    selector = ".cell:nth-of-type(2) .celltoolbar > .button_container > button";
    this.waitForSelector(selector);
    this.thenClick(selector);

    this.waitForSelector(".modal-body");

    this.then(function() {
        var md = this.evaluate(function() {
            var raw_md = $("textarea[name=\"metadata\"]").val();
            var md = JSON.parse(raw_md);
            return md;
        });

        var urls = md.referenceURLs;
        this.test.assertEquals(
            urls,
            ["URL5","URL6"],
            "Cell 2 metadata successfully saved"
        );
    });

    selector = "button.close";
    this.thenClick(selector);

    this.waitWhileSelector(".modal");

    selector = "li[data-name=\"Linker%20Extension\"] > a";
    this.thenClick(selector);

    //Check that inputs were refilled in correctly

    this.then(function() {
        var cell1_inputs = this.evaluate(function() {
            var inputs = {};
            inputs.url1 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(1) > input").val();
            inputs.url2 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(2) > input").val();
            inputs.url3 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(3) > input").val();
            inputs.url4 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").val();

            return inputs;
        });

        var cell2_inputs = this.evaluate(function() {
            var inputs = {};
            inputs.url1 = $(".cell-urls:eq(1) > .referenceURL_div:nth-child(1) > input").val();
            inputs.url2 = $(".cell-urls:eq(1) > .referenceURL_div:nth-child(2) > input").val();

            return inputs;
        });

        this.test.assertEquals(
            cell1_inputs.url1,
            "URL1",
            "Cell 1 input 1 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url2,
            "URL2",
            "Cell 1 input 2 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url3,
            "URL3",
            "Cell 1 input 3 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url4,
            "URL4",
            "Cell 1 input 4 refilled successfully"
        );
        this.test.assertEquals(
            cell2_inputs.url1,
            "URL5",
            "Cell 2 input 1 refilled successfully"
        );
        this.test.assertEquals(
            cell2_inputs.url2,
            "URL6",
            "Cell 2 input 2 refilled successfully"
        );
    });

    this.thenEvaluate(function() {
        $(".cell-urls:eq(0) .remove-cell-url-button:eq(2)").click(); //remove URL3

        $(".cell-urls:eq(0) .add-cell-url-button").click();
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").val("URL7");
        $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").change();

        //need to add an extra one so we can remove URL 6
        $(".cell-urls:eq(1) .add-cell-url-button").click();

        $(".cell-urls:eq(1) .remove-cell-url-button:eq(1)").click(); //remove URL6
    });

    //check the cell metadata using edit metadata

    selector = "li[data-name=\"Edit%20Metadata\"] > a";
    this.thenClick(selector);

    selector = ".cell:nth-of-type(1) .celltoolbar > .button_container > button";
    this.thenClick(selector);

    this.waitForSelector(".modal-body");

    this.then(function() {
        var md = this.evaluate(function() {
            var raw_md = $("textarea[name=\"metadata\"]").val();
            var md = JSON.parse(raw_md);
            return md;
        });

        var urls = md.referenceURLs;
        this.test.assertEquals(
            urls,
            ["URL1","URL2","URL4","URL7"],
            "Cell 1 metadata successfully saved after delete"
        );
    });

    selector = "button.close";
    this.thenClick(selector);

    this.waitWhileSelector(".modal");

    selector = ".cell:nth-of-type(2) .celltoolbar > .button_container > button";
    this.waitForSelector(selector);
    this.thenClick(selector);

    this.waitForSelector(".modal-body");

    this.then(function() {
        var md = this.evaluate(function() {
            var raw_md = $("textarea[name=\"metadata\"]").val();
            var md = JSON.parse(raw_md);
            return md;
        });

        var urls = md.referenceURLs;
        this.test.assertEquals(
            urls,
            ["URL5"],
            "Cell 2 metadata successfully saved after delete"
        );
    });

    selector = "button.close";
    this.thenClick(selector);

    this.waitWhileSelector(".modal");

    selector = "li[data-name=\"Linker%20Extension\"] > a";
    this.thenClick(selector);

    //Check that inputs were refilled in correctly

    this.then(function() {
        var cell1_inputs = this.evaluate(function() {
            var inputs = {};
            inputs.url1 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(1) > input").val();
            inputs.url2 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(2) > input").val();
            inputs.url3 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(3) > input").val();
            inputs.url4 = $(".cell-urls:eq(0) > .referenceURL_div:nth-child(4) > input").val();

            return inputs;
        });

        var cell2_inputs = this.evaluate(function() {
            var inputs = {};
            inputs.url1 = $(".cell-urls:eq(1) > .referenceURL_div:nth-child(1) > input").val();

            return inputs;
        });

        this.test.assertEquals(
            cell1_inputs.url1,
            "URL1",
            "Cell 1 input 1 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url2,
            "URL2",
            "Cell 1 input 2 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url3,
            "URL4",
            "Cell 1 input 3 refilled successfully"
        );
        this.test.assertEquals(
            cell1_inputs.url4,
            "URL7",
            "Cell 1 input 4 refilled successfully"
        );
        this.test.assertEquals(
            cell2_inputs.url1,
            "URL5",
            "Cell 2 input 1 refilled successfully"
        );
    });

    //check text of toggle button before reload

    this.waitFor(function() {
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        if(text !== "Show/Hide cell references toolbar" && text !== "") {
            //this is the default text and empty string, so either unloaded yet
            //or our promise hasn't resolved yet
            return true;
        }
    }, function then() {
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        this.test.assertEquals(
            text,
            "Hide cell references toolbar",
            "Toggle button says hide when it is visible before reload"
        );
    });

    var nbname = "custom_cell_toolbar.ipynb";
    this.thenEvaluate(function (nbname) {
        require(["base/js/events"], function (events) {
            Jupyter.notebook.set_notebook_name(nbname);
            Jupyter._save_success = Jupyter._save_failed = false;
            events.on("notebook_saved.Notebook", function () {
                Jupyter._save_success = true;
            });
            events.on("notebook_save_failed.Notebook", function (event, error) {
                Jupyter._save_failed = "save failed with " + error;
            });
            Jupyter.notebook.save_notebook();
        });
    }, {nbname:nbname});
    
    this.waitFor(function () {
        return this.evaluate(function(){
            return Jupyter._save_failed || Jupyter._save_success;
        });
    });

    this.then(function(){
        var success_failure = this.evaluate(function(){
            return [Jupyter._save_success, Jupyter._save_failed];
        });
        this.test.assertEquals(success_failure[1], false, "Save did not fail");
        this.test.assertEquals(success_failure[0], true, "Save OK");
    });

    
    //shutdown
    this.then(function() {
        this.shutdown_current_kernel();
    });
    this.wait(2000);

    this.then(function() {
        this.test.assertNot(this.kernel_running(),"Notebook shutdown successfully");
    });

    this.then(function() {
        this.open(this.get_notebook_server());
    });

    this.waitFor(this.page_loaded);
    this.wait_for_dashboard();

    //go back into notebook - we're doing this to check
    //that the notebook was saved automatically
    this.then(function(){
        var notebook_url = this.evaluate(function(nbname){
            var escaped_name = encodeURIComponent(nbname);
            var return_this_thing = null;
            $("a.item_link").map(function (i,a) {
                if (a.href.indexOf(escaped_name) >= 0) {
                    return_this_thing = a.href;
                    return;
                }
            });
            return return_this_thing;
        }, {nbname:nbname});
        this.test.assertNotEquals(
            notebook_url,
            null,
            "Found URL in notebook list"
        );
        // open the notebook
        this.open(notebook_url);
    });

    //wait for redirect
    this.waitFor(this.kernel_running);
    this.waitFor(function() {
        return this.evaluate(function () {
            return Jupyter && Jupyter.notebook && true;
        });
    });

    //check that we're back in the notebook
    //(via checking the notebook name in the ipython instance)
    this.then( function() {
        var name = this.evaluate(function() {
            return Jupyter.notebook.notebook_name;
        });
        this.test.assertEquals(
            name,
            nbname,
            "Re-opened notebook successfully"
        );
    });

    //check text of toggle button after reload

    this.waitFor(function() {
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        if(text !== "Show/Hide cell references toolbar" && text !== "") {
            //this is the default text and empty string, so either unloaded yet
            //or our promise hasn't resolved yet
            return true;
        }
    }, function then() {
        var text = this.evaluate(function() {
            return $("#toggle_cell_references_bar").text();
        });
        this.test.assertEquals(
            text,
            "Show cell references toolbar",
            "Toggle button always defaults to hidden after a reload"
        );
    });
});