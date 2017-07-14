var system = require("system");
var fs = require("fs");
var screenshot_dir = "screenshots/add_metadata/";

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing adding report metadata");

    this.viewport(1024, 768);

    var nbname = "test_add_metadata.ipynb";
    this.thenEvaluate(function(nbname) {
        Jupyter.notebook.set_notebook_name(nbname);
    }, {nbname:nbname});

    var path_parts = fs.absolute(this.test.currentTestFile).split("/");
    path_parts.pop();
    path_parts.pop();
    var test_path = path_parts.join("/") + "/";

    var username = "";
    
    var screenshot_index = 1;
    
    function take_screenshot(name) {
    	var index_string = screenshot_index.toString();
        casper.waitUntilVisible('#next', function () {
            casper.capture(screenshot_dir + index_string +
            		       ". " + name + ".png");
        });
        
        screenshot_index++;
    }

    //we need username to test autofill
    //so either read the info via the login_credentials text file
    //or prompt the user for their username and password
    this.then(function() {
        if (fs.exists(test_path + "login_credentials.txt")) {
            var text = fs.read(test_path + "login_credentials.txt");
            var lines = text.split(/\r\n|[\r\n]/g);
            username = lines[1];
        }
        if (username == "[Your Username Here]" || username == "")
        {
            system.stdout.writeLine("Username: ");
            username = system.stdin.readLine();
        }
    });

    this.then(function() {
        this.evaluate(function(username) {
            var nb_utils = require("base/js/utils");
            var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                     "/linker_config");
            var settings = {
                processData : false,
                cache : false,
                type : "POST",
                contentType: "application/json",
                data: JSON.stringify({"username": username}),
            };
            var request = nb_utils.promising_ajax(request_url, settings);
        },{username: username});
    });

    //test abstract cell was created right, and remove defaults to test validation
    this.then(function() {
        var cell_type = this.evaluate(function() {
            return Jupyter.notebook.get_cell(0).cell_type;
        });
        this.test.assertEquals(cell_type,"markdown","Abstract cell type changed");
        var cell_val = this.evaluate(function() {
            return Jupyter.notebook.get_cell(0).get_text();
        });
        this.test.assertEquals(
            cell_val,
            "The first cell of the notebook is used as the abstract for the " + 
            "notebook. Please enter your abstract here. If you accidentally " + 
            "delete this cell, please just create a new markdown cell at the " +
            "top of the notebook.",
            "Default text inserted into abstract cell successfully.");
        this.evaluate(function() {
            Jupyter.notebook.get_cell(0).cell_type = "code";
            Jupyter.notebook.cells_to_code();
        });
        this.evaluate(function() {
            Jupyter.notebook.get_cell(0).set_text("");
        });
    });

    //Click on menu item
    this.waitForSelector("#manage_metadata > a");
    this.thenClick("#manage_metadata > a");

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);
    
    take_screenshot("open-modal");

    //check that certain fields are required 
    this.waitForSelector("#next");
    this.thenClick("#next");
    
    take_screenshot("abstract-error");
    
    this.then(function() {
        this.test.assertExists("#nb-abstract-invalid-error",
                               "Abstract invalid error exists");
    });
    
    //recreate valid abstract cell
    this.thenClick(".close");
    this.waitWhileVisible(".modal-body");
    this.waitWhileVisible(".modal-backdrop");
    this.then(function() {
        this.evaluate(function() {
            Jupyter.notebook.get_cell(0).cell_type = "markdown";
            Jupyter.notebook.cells_to_markdown();
        });
        this.evaluate(function() {
            Jupyter.notebook.get_cell(0).set_text("My abstract");
        });
    });

    //Click on menu item
    this.waitForSelector("#manage_metadata > a");
    this.thenClick("#manage_metadata > a");

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that certain fields are required 
    this.waitForSelector("#next");
    this.thenClick("#next");
    
    
    take_screenshot("title-error");

    this.thenClick("#expand_1");
    
    take_screenshot("expand-page-1");
    
    this.then(function() {
        this.test.assertExists("#title-missing-error",
                               "Title missing error exists");
        this.test.assertDoesntExist("#nb-abstract-invalid-error",
                                    "Abstract invalid error does not exist");
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

    this.waitFor(function() {
        return this.evaluate(function() {
            return $("#department").children().length > 0;
        });
    });

    this.waitFor(function check() {
        return this.evaluate(function() {
            return ($("#author-last-name-0").val() && $("#author-first-name-0").val() && $("#department").val());
        });
    }, function success() { //success
        this.test.assert(true,"Author and department successfully filled from username in config");
    }, function fail() {
        this.test.assert(false,"Author and department unsuccessfully filled from username in config");
    }, 10000);

    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields1 > div#author > div#author-0", {
            "#author-last-name-0": "",
            "#author-first-name-0": "",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#author-missing-error",
                               "Author missing error exists");
    });
    
    
    take_screenshot("missing-author");

    //test autocomplete
    this.then(function() {
        this.sendKeys("#author-first-name-0","Lou");
        this.sendKeys("#author-last-name-0","Davie",{keepFocus: true});
    });
    this.waitUntilVisible(".ui-autocomplete");

    
    take_screenshot("autocomplete-appears");
    
    this.thenClick(".ui-autocomplete li.ui-menu-item:first-child a");

    this.then(function() {
        var first = this.evaluate(function() {
            return $("#author-first-name-0").val();
        });
        var last = this.evaluate(function() {
            return $("#author-last-name-0").val();
        });
        this.test.assertEquals(first,"Louise","Autocomplete first name using last name field working");
        this.test.assertEquals(last,"Davies","Autocomplete last name using last name field working");
    });
    
    
    take_screenshot("autocomplete-working");

    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields1", {
            "#author-last-name-0": "",
            "#author-first-name-0": "",
        });
    });

    this.then(function() {
        this.sendKeys("#author-last-name-0","Davie");
        this.sendKeys("#author-first-name-0","Lou",{keepFocus: true});
    });
    this.waitUntilVisible(".ui-autocomplete");

    this.thenClick(".ui-autocomplete li.ui-menu-item:first-child a");

    this.then(function() {
        var first = this.evaluate(function() {
            return $("#author-first-name-0").val();
        });
        var last = this.evaluate(function() {
            return $("#author-last-name-0").val();
        });
        this.test.assertEquals(first,"Louise","Autocomplete first name using first name field working");
        this.test.assertEquals(last,"Davies","Autocomplete last name using first name field working");
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
    
    
    take_screenshot("set-current-date");

    //testing the date validation
    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#md_fields1 > div#extra_metadata_1", {
            "year": "0",
            "month": "0",
            "day": "31",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists(
            "#year-missing-error",
            "Year missing error exists"
        );
    });
    
    take_screenshot("year-error");
    
    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#md_fields1", {
            "year": "2000",
            "month": "0",
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
    
    
    take_screenshot("month-error");

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#md_fields1", {
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
    
    take_screenshot("day-error");

    this.then(function() {
        this.fill("form#add_metadata_form > fieldset#md_fields1", {
            "title": "My Title",
            "year": "1997", //not a leap year
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
        this.fill("form#add_metadata_form > fieldset#md_fields1", {
            "title": "My Title",
            "year": "2000", //is a leap year!
            "month": "2",
            "day": "29",
        });
    });
    this.thenClick("#next");
    this.then(function() {
        this.test.assertVisible(
            "#md_fields2",
            "Leap year logic working for accepting valid combos"
        );
    });

    this.thenClick("#previous");
    this.waitForSelector("#add-author-button");
    //create two extra author fields - we'll end up leaving one blank
    this.thenClick("#add-author-button");
    this.thenClick("#add-author-button");

    
    take_screenshot("added-authors");
    
    //Add some test metadata
    this.then(function() {
        //need to use fillSelectors over fill to fill in the authors
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields1", { 
            "#title": "My Title",
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
    
    take_screenshot("page-1-filled");
    this.thenClick("#next");
    this.then(function() {
        this.test.assertVisible("#md_fields2","Valid data has been accepted");
    });
    
    take_screenshot("page-2");
    

    this.thenClick("#next");
    this.then(function() {
        this.test.assertDoesntExist("#licence-dropdown-error",
                                    "Licence dropdown invalid error doesn't exist");
        this.test.assertExists("#repository-missing-error",
                               "Repository missing error exists");
    });
    
    take_screenshot("repository-error");
    
    this.thenClick("#expand_2");
    
    take_screenshot("expand-page-2");
    

    //keep track of the autofilled department so that we can refill it
    //later - this ensures that whoever's user credentials are used for the
    //test is posting to the department that they most likely have access to.
    var department = "";
    this.then(function() {
        department = this.evaluate(function() {
            return $("#department").val();
        });
        this.evaluate(function() {
            $("#nb-licence-dropdown").val("");
        });
    });

    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#licence-dropdown-error",
                               "Licence dropdown invalid error exists");
        this.test.assertExists("#repository-missing-error",
                               "Repository missing error exists");
    });
    
    take_screenshot("licence-error");
    
    this.then(function(){
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields2", {
            "#nb-licence-dropdown": "CC0",
            "#department": department,
        });
    });
    
    take_screenshot("filled-licence-and-dept");

    //TODO: when communities finalised make it so we always test to the default
    //repository

    //wait for repository to have more items in it than the "None Selected" option
    this.waitFor(function() {
        return this.evaluate(function() {
            return $("#repository").children().length > 1;
        });
    });

    this.then(function(){
        var repository = this.evaluate(function() {
            return $("#repository").children().eq(1).val(); //get first non-empty option
        });
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields2", {
            "#repository": repository,
        });
    });
    take_screenshot("repository-filled");

    this.waitForSelector("#add-nb-referenced-by-button");
    //again, create two extra boxes but we'll only use one
    this.thenClick("#add-nb-referenced-by-button");
    this.thenClick("#add-nb-referenced-by-button");

    this.waitForSelector("#add-nb-citation-button");
    //again, create two extra boxes but we'll only use one
    this.thenClick("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");

    take_screenshot("citations-and-references-added");
    
    this.then(function() {
        //need to use fillSelectors for the referencedBy urls
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields2", {
            "#publisher": "test publisher",
            "#nb-citation-0": "Citation 1",
            "#nb-citation-2": "Citation 2",
            "#nb-referenced-by-0": "URL1",
            "#nb-referenced-by-2": "URL2"
        });
    }); //TODO: add funders and sponsors if we can use them

    take_screenshot("filled-page-2");
    
    this.thenClick("#tos-select");
    this.waitForSelector("#select");
    take_screenshot("click-tos-select");
    
    this.waitForSelector("#cancel");
    this.thenClick("#cancel");
    
    this.waitForSelector("#next");
    this.thenClick("#next");
    this.waitWhileVisible(".modal",function(){},function() {
        this.capture("screenshots/modal_lingering.png");
    });

    //hook into the notebook saved event
    this.evaluate(function() {
        require(['base/js/events'], function (events) {
            events.on("notebook_saved.Notebook",function() {
                Jupyter._save_success = true;
            });
        });
    });

    //wait for the notebook saved event to be triggered
    //and thus set _save_success to true
    this.waitFor(function() {
        return this.evaluate(function() {
            return Jupyter._save_success;
        });
    }, function success() {
        this.test.assert(true,"Notebook saved event triggered");
    }, function fail() {
        this.test.assert(false,"Notebook saved event not triggered");
    });

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
                    department: "",
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
                    department: md.reportmetadata.department,
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
            metadata.department,
            "12",
            "Department has been set correctly"
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
                    department: "",
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
                    department: md.reportmetadata.department,
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
            metadata.department,
            "12",
            "Department has been saved correctly"
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
    this.waitForSelector("#add_metadata > a");
    this.thenClick("#add_metadata > a");

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
                departmentval: $("#department").val(),
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
            vals.departmentval,
            "12",
            "Department displays properly in the form once set"
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
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields1", {
            "#author-last-name-3": "McCoy",
            "#author-first-name-3": "Leonard",
        });
    }); 

    this.thenEvaluate(function() {
        $("#author-last-name-2").parent().find("button").click();
    });

    this.thenClick("#next");

    this.waitForSelector("#add-nb-referencedBy-button");
    this.thenClick("#add-nb-referencedBy-button");
    this.thenClick("#add-nb-referencedBy-button");

    this.waitForSelector("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");
    this.thenClick("#add-nb-citation-button");

    this.thenClick("#licence-url-radio");

    this.then(function() {
        //need to use fillSelectors for the referencedBy urls
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields2", {
            "#nb-citation-2": "Citation 3",
            "#nb-citation-3": "Citation 4",
            "#nb-referencedBy-2": "URL3",
            "#nb-referencedBy-3": "URL4",
            "#nb-licence-dropdown": "Other"
        });
    });

    this.then(function() {
        this.fillSelectors("form#add_metadata_form > fieldset#md_fields2", {
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
