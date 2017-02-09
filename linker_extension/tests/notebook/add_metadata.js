casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing adding report metadata");

    this.viewport(1024, 768);

    //Click on menu item
    var selector = "#add_metadata > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that certain fields are required 
    this.waitForSelector("#next");
    this.thenClick("#next");

    this.then(function() {
        this.test.assertExists("#title-missing-error",
                               "Title missing error exists");
        this.test.assertExists("#author-missing-error",
                               "Author missing error exists");
        this.test.assertExists("#nb-abstract-missing-error",
                               "Abstract missing error exists");
        var date = [];
        var curr_date = new Date();
        date.push(curr_date.getDate().toString());
        date.push((curr_date.getMonth() + 1).toString());
        date.push(curr_date.getFullYear().toString());

        var test_date = this.evaluate(function() {
            var date_arr = [];
            date_arr.push($("#day").val());
            date_arr.push($("#month").val());
            date_arr.push($("#year").val());
            return date_arr;
        });
        this.test.assertEquals(date,test_date,"Current date has been inserted right");

    });

    //test the clear date and set to current date buttons
    this.thenClick("#clear-date");
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#year-missing-error",
                               "Year missing error exists");
    });
    this.thenClick("#current-date");
    this.then(function () {
        var date = [];
        var curr_date = new Date();
        date.push(curr_date.getDate().toString());
        date.push((curr_date.getMonth() + 1).toString());
        date.push(curr_date.getFullYear().toString());
        
        var test_date = this.evaluate(function() {
            var date_arr = [];
            date_arr.push($("#day").val());
            date_arr.push($("#month").val());
            date_arr.push($("#year").val());
            return date_arr;
        });
        this.test.assertEquals(date,test_date,"Current date has been reinserted right");
    });

    this.thenClick("#clear-date");

    //testing the date validation
    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#fields1", {
            "#title": "My Title",
            "#author-last-name-0": "Davies",
            "#author-first-name-0": "Louise",
            "#nb-abstract": "My abstract",
            "#year": "4000",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#invalid-year-error",
            "Upper bound on year limit working"
        );
    });


    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#fields1", {
            "title": "My Title",
            "abstract": "My abstract",
            "year": "1000",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#invalid-year-error",
            "Lower bound on year limit working"
        );
    });

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#fields1", {
            "title": "My Title",
            "abstract": "My abstract",
            "year": "2000",
            "day": "31",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#month-missing-error",
            "Month missing error exists"
        );
    });

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#fields1", {
            "title": "My Title",
            "abstract": "My abstract",
            "year": "2000",
            "month": "2",
            "day": "31",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#invalid-day-error",
            "Date logic working for rejecting invalid combos"
        );
    });

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#fields1", {
            "title": "My Title",
            "abstract": "My abstract",
            "year": "1900", //not a leap year
            "month": "2",
            "day": "29",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#invalid-day-error",   
            "Leap year logic working for rejecting invalid combos"
        );
    });

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#fields1", {
            "title": "My Title",
            "abstract": "My abstract",
            "year": "2000", //is a leap year!
            "month": "2",
            "day": "29",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertVisible(
            "#fields2",
            "Leap year logic working for accepting valid combos"
        );
    });

    this.thenClick("#previous");
    this.waitForSelector("#add-author-button");
    //create two extra author fields - we'll end up leaving one blank
    this.thenClick("#add-author-button");
    this.thenClick("#add-author-button");

    //Add some test metadata
    this.then(function() {
        //need to use fillSelectors over fill to fill in the authors
        this.fillSelectors("form#add_metadata_form > fieldset#fields1", { 
            "#title": "My Title",
            "#nb-abstract": "My abstract",
            "#year": "1995",
            "#month": "8",
            "#day": "20",
            "#language": "en",
            "#tags": "tag1\ntag2",
            "#author-last-name-1": "S'chn T'gai",
            "#author-first-name-1": "Spock",
            "#author-last-name-3": "Kirk",
            "#author-first-name-3": "James",
        });
    }); 
    this.thenClick("#next");
    this.then(function() {
        this.test.assertVisible("#fields2","Valid data has been accepted");
    });

    this.waitForSelector("#collections_loaded"); //feels dirty...

    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#repository-missing-error",
                               "Repository missing error exists");
        this.test.assertExists("#licence-dropdown-error",
                               "Licence dropdown invalid error exists");
    });

    this.then(function(){
        this.fillSelectors("form#add_metadata_form > fieldset#fields2", {
            "#repository": "edata/8", //the handle for SCD
            "#nb-licence-dropdown": "Other"
        });
    });

    //test that the licence file upload is disabled on add metadata
    this.then(function() {
        var disabled = this.evaluate(function() {
            return ($("#licence-file").prop("disabled") && $("#licence-file-radio").prop("disabled"));
        });
        this.test.assert(disabled,"Licence file selection is correctly disabled");
    });

    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#no-licence-error",
                               "No checkbox selected error exists");
    });

    this.thenClick("#licence-url-radio");
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#no-licence-url-error",
                               "URL empty error exists");
    });

    this.then(function(){
        this.fillSelectors("form#add_metadata_form > fieldset#fields2", {
            "#nb-licence-dropdown": "CC0"
        });
    });

    this.waitForSelector("#add-nb-referencedBy-button");
    //again, create two extra boxes but we'll only use one
    this.thenClick("#add-nb-referencedBy-button");
    this.thenClick("#add-nb-referencedBy-button");

    this.waitForSelector("#add-nb-citation-button");
    //again, create two extra boxes but we'll only use one
    this.thenClick("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");

    this.then(function() {
        //need to use fillSelectors for the referencedBy urls
        this.fillSelectors("form#add_metadata_form > fieldset#fields2", {
            "#publisher": "test publisher",
            "#nb-citation-0": "Citation 1",
            "#nb-citation-2": "Citation 2",
            "#nb-referencedBy-0": "URL1",
            "#nb-referencedBy-2": "URL2"
        });
    }); //TODO: add funders and sponsors if we can use them
    this.thenClick("#next");
    this.waitWhileVisible(".modal");

    //Should be within notebook metadata now.     
    this.then(function() {
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    title: "",
                    abstract: "",
                    date:"",
                    language: "",
                    tags: [],
                    authors: [],
                    publisher: "",
                    citations: "",
                    referencedBy: [],
                    repository: "",
                    licence_preset: "",
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    language: md.reportmetadata.language,
                    tags: md.reportmetadata.tags,
                    authors: md.reportmetadata.authors,
                    publisher: md.reportmetadata.publisher,
                    citations: md.reportmetadata.citations,
                    referencedBy: md.reportmetadata.referencedBy,
                    repository: md.reportmetadata.repository,
                    licence_preset: md.reportmetadata.licence_preset,
                };
            }
            
        });
        this.test.assertEquals(
            metadata.title,
            "My Title",
            "Title has been set correctly"
        );
        this.test.assertEquals(
            metadata.abstract,
            "My abstract",
            "Abstract has been set correctly"
        );
        this.test.assertEquals(
            metadata.date,
            "1995-08-20",
            "Date has been set correctly"
        );
        this.test.assertEquals(
            metadata.language,
            "en",
            "Language has been set correctly"
        );
        this.test.assertEquals(
            metadata.tags,
            ["tag1","tag2"],
            "Tags have been set correctly"
        );
        this.test.assertEquals(
            metadata.authors,
            [["Davies","Louise"],["S'chn T'gai","Spock"],["Kirk","James"]],
            "Authors have been set correctly"
        );
        this.test.assertEquals(
            metadata.publisher,
            "test publisher",
            "Publisher has been set correctly"
        );
        this.test.assertEquals(
            metadata.citations,
            ["Citation 1","Citation 2"],
            "Citations has been set correctly"
        );
        this.test.assertEquals(
            metadata.referencedBy,
            ["URL1","URL2"],
            "ReferencedBy had been set correctly"
        );
        this.test.assertEquals(
            metadata.repository,
            "edata/8",
            "Repository has been set correctly"
        );
        this.test.assertEquals(
            metadata.licence_preset,
            "CC0",
            "Licence has been set correctly"
        );
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
    var nbname = "Untitled.ipynb";
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
            "Untitled.ipynb",
            "Re-opened notebook successfully"
        );
    });

    //check that our metadata has been saved to the notebook metadata
    this.then(function() {
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    title: "",
                    abstract: "",
                    date:"",
                    language: "",
                    tags: [],
                    authors: [],
                    publisher: "",
                    citations: "",
                    referencedBy: [],
                    repository: "",
                    licence_preset: "",
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    language: md.reportmetadata.language,
                    tags: md.reportmetadata.tags,
                    authors: md.reportmetadata.authors,
                    publisher: md.reportmetadata.publisher,
                    citations: md.reportmetadata.citations,
                    referencedBy: md.reportmetadata.referencedBy,
                    repository: md.reportmetadata.repository,
                    licence_preset: md.reportmetadata.licence_preset,
                };
            }
            
        });
        this.test.assertEquals(
            metadata.title,
            "My Title",
            "Title has been saved correctly"
        );
        this.test.assertEquals(
            metadata.abstract,
            "My abstract",
            "Abstract has been saved correctly"
        );
        this.test.assertEquals(
            metadata.date,
            "1995-08-20",
            "Date has been saved correctly"
        );
        this.test.assertEquals(
            metadata.language,
            "en",
            "Language has been saved correctly"
        );
        this.test.assertEquals(
            metadata.tags,
            ["tag1","tag2"],
            "Tags have been set correctly"
        );
        this.test.assertEquals(
            metadata.authors,
            [["Davies","Louise"],["S'chn T'gai","Spock"],["Kirk","James"]],
            "Authors have been saved correctly"
        );
        this.test.assertEquals(
            metadata.publisher,
            "test publisher",
            "Publisher has been saved correctly"
        );
        this.test.assertEquals(
            metadata.citations,
            ["Citation 1","Citation 2"],
            "Citations has been set correctly"
        );
        this.test.assertEquals(
            metadata.referencedBy,
            ["URL1","URL2"],
            "ReferencedBy had been saved correctly"
        );
        this.test.assertEquals(
            metadata.repository,
            "edata/8",
            "Repository has been saved correctly"
        );
        this.test.assertEquals(
            metadata.licence_preset,
            "CC0",
            "Licence has been saved correctly"
        );
    });

    // Click on menuitem
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that when you reopen the dialog the text boxes
    //have been filled with the current data
    this.then(function() {
        var vals = this.evaluate(function(){
            return {
                titleval: $("#title").val(),
                abstractval: $("#nb-abstract").val(),
                yearval: $("#year").val(),
                monthval: $("#month").val(),
                dayval: $("#day").val(),
                tagsval: $("#tags").val(),
                authorfn0val: $("#author-first-name-0").val(),
                authorln0val: $("#author-last-name-0").val(),
                authorfn1val: $("#author-first-name-1").val(),
                authorln1val: $("#author-last-name-1").val(),
                languageval: $("#language").val(),
                publisherval: $("#publisher").val(),
                citation0val: $("#nb-citation-0").val(),
                citation1val: $("#nb-citation-1").val(),
                reference0val: $("#nb-referencedBy-0").val(),
                reference1val: $("#nb-referencedBy-1").val(),
                repositoryval: $("#repository").val(),
                licenceval: $("#nb-licence-dropdown").val(),
            };
        });
        this.test.assertEquals(
            vals.titleval,
            "My Title",
            "Title displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.abstractval,
            "My abstract",
            "Abstract displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.yearval,
            "1995",
            "Year displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.monthval,
            "8",
            "Month displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.dayval,
            "20",
            "Day displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.tagsval,
            "tag1\ntag2\n",
            "Tags displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.authorfn0val,
            "Louise",
            "1st author first name displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.authorln0val,
            "Davies",
            "1st author last name displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.authorfn1val,
            "Spock",
            "2nd author first name displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.authorln1val,
            "S'chn T'gai",
            "2nd author last name displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.languageval,
            "en",
            "Language displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.publisherval,
            "test publisher",
            "Publisher displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.citation0val,
            "Citation 1",
            "Citation 0 displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.citation1val,
            "Citation 2",
            "Citation 1 displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.reference0val,
            "URL1",
            "Reference 0 displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.reference1val,
            "URL2",
            "Reference 1 displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.repositoryval,
            "edata/8",
            "Repository displays properly in the form once set"
        );
        this.test.assertEquals(
            vals.licenceval,
            "CC0",
            "Licence displays properly in the form once set"
        );
    });

    //testing deletion of the multi-field vairables
    this.waitForSelector("#add-author-button");
    this.thenClick("#add-author-button");
    this.thenClick("#add-author-button");

    //Add some test metadata
    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#fields1", {
            "#author-last-name-3": "McCoy",
            "#author-first-name-3": "Leonard",
        });
    }); 

    this.thenEvaluate(function() {
        $("#author-last-name-2").parent().find("button").click();
    });

    this.thenClick("#next");

    this.waitForSelector("#collections_loaded"); //feels dirty...

    this.waitForSelector("#add-nb-referencedBy-button");
    this.thenClick("#add-nb-referencedBy-button");
    this.thenClick("#add-nb-referencedBy-button");

    this.waitForSelector("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");

    this.thenClick("#licence-url-radio");

    this.then(function() {
        //need to use fillSelectors for the referencedBy urls
        this.fillSelectors("form#add_metadata_form > fieldset#fields2", {
            "#nb-citation-2": "Citation 3",
            "#nb-citation-3": "Citation 4",
            "#nb-referencedBy-2": "URL3",
            "#nb-referencedBy-3": "URL4",
            "#nb-licence-dropdown": "Other"
        });
    });

    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#fields2", {
            "#licence-url": "Test"
        });
    });

    this.thenEvaluate(function() {
        $("#nb-citation-1").parent().find("button").click();
        $("#nb-citation-2").parent().find("button").click();
        $("#nb-referencedBy-1").parent().find("button").click();
        $("#nb-referencedBy-2").parent().find("button").click();
    });

    this.thenClick("#next");
    this.waitWhileVisible(".modal");

    //Should be within notebook metadata now.     
    this.then(function() {
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    authors: [],
                    citations: [],
                    referencedBy: [],
                    licence_preset: "",
                    licence_url: "",
                };
            } else {
                return {
                    authors: md.reportmetadata.authors,
                    citations: md.reportmetadata.citations,
                    referencedBy: md.reportmetadata.referencedBy,
                    licence_preset: md.reportmetadata.licence_preset,
                    licence_url: md.reportmetadata.licence_url
                };
            }
            
        });
        this.test.assertEquals(
            metadata.authors,
            [["Davies","Louise"],["S'chn T'gai","Spock"],["McCoy","Leonard"]],
            "Authors have been set correctly after deleting some"
        );
        this.test.assertEquals(
            metadata.citations,
            ["Citation 1","Citation 4"],
            "Citations have been set correctly after deleting some"
        );
        this.test.assertEquals(
            metadata.referencedBy,
            ["URL1","URL4"],
            "ReferencedBy have been set correctly after deleting some"
        );
        this.test.assertEquals(
            metadata.licence_preset,
            "Other",
            "Licence_preset has been changed properly"
        );
        this.test.assertEquals(
            metadata.licence_url,
            "Test",
            "Licence_url has been saved to the metadata"
        );
    });
});