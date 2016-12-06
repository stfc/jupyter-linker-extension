

//MUST BE RUN USING SLIMERJS AS PHANTOMJS DOES NOT SUPPORT XML PARSING
casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing adding report metadata");

    this.viewport(1024, 768);

    //Click on menu item
    var selector = '#add_metadata > a';
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //Add some test metadata
    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '1995',

        });
    }); //TODO: check all the fields work. Also need to check the validators.
    this.waitForSelector('#next');
    this.thenClick('#next');
    this.wait(300);
    this.waitForSelector("#collections_loaded"); //feels dirty...
    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields2', {
            'repository': "8" //8 is SCD
        });
    });
    this.thenEvaluate(function() {
        console.log($(document.body).html());
    });
    this.thenClick('#next');
    this.wait(300);

    //Should be within notebook metadata now.     
    this.then(function() {
        var that = this;
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    title: "",
                    abstract: "",
                    year: '',
                    repository: '',
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    repository: md.reportmetadata.repository,
                };
            }
            
        });
        this.test.assertEquals(metadata.title,"My Title","Title has been set correctly");
        this.test.assertEquals(metadata.abstract,"My abstract","Abstract has been set correctly");
        this.test.assertEquals(metadata.date,"1995","Date has been set correctly");
        this.test.assertEquals(metadata.repository,"8","Repository has been set correctly");
    });

    //shutdown
    this.then(function() {
        this.shutdown_current_kernel();
    });
    this.wait(2000);

    this.then(function() {
        this.test.assertNot(this.kernel_running(),"Notebook shutdown successfully");
    });
   
    //go to dashboard
    this.then(function(){
        this.open_dashboard();
    });

    //go back into notebook - we're doing this to check that the notebook was saved automatically
    var nbname = 'Untitled.ipynb';
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
        this.test.assertNotEquals(notebook_url, null, "Found URL in notebook list");
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

    //check that we're back in the notebook (via checking the notebook name in the ipython instance)
    this.then( function() {
        var name = this.evaluate(function() {
            return Jupyter.notebook.notebook_name;
        });
        this.test.assertEquals(name, "Untitled.ipynb","Re-opened notebook successfully");
    });

    //check that our metadata has been saved to the notebook metadata
    this.then(function() {
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                    return {
                    title: "",
                    abstract: "",
                    year: '',
                    repository: '',
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    repository: md.reportmetadata.repository,
                };
            }
        });
        this.test.assertEquals(metadata.title,"My Title","Title has been saved correctly");
        this.test.assertEquals(metadata.abstract,"My abstract","Abstract has been saved correctly");
        this.test.assertEquals(metadata.date,"1995","Date has been saved correctly");
        this.test.assertEquals(metadata.repository,"8","Repository has been saved correctly");
    });

    // Click on menuitem
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that when you reopen the dialog the text boxes have been filled with the current data
    this.then(function() {
        var vals = this.evaluate(function(){
            return {
                titleval: document.getElementById('title').value,
                abstractval: document.getElementById('abstract').value,
                yearval: document.getElementById('year').value,
                repositoryval: document.getElementById('repository').value,
            };
        });
        this.test.assertEquals(vals.titleval,"My Title","Title displays properly in the form once set");
        this.test.assertEquals(vals.abstractval,"My abstract","Abstract displays properly in the form once set");
        this.test.assertEquals(vals.yearval,"1995","Date displays properly in the form once set");
        this.test.assertEquals(vals.repositoryval,"8","Repository displays properly in the form once set");
    });
    
});
