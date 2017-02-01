var system = require("system");
var fs = require("fs");

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the publish notebook button and dialog");

    this.viewport(1024, 768);

    var path_parts = fs.absolute(this.test.currentTestFile).split("/");
    path_parts.pop();
    path_parts.pop();
    var test_path = path_parts.join("/") + "/";

    var username = "";
    var password = "";
    this.then(function() {
        var path_parts = fs.absolute(this.test.currentTestFile).split("/");
        path_parts.pop();
        path_parts.pop();
        var test_path = path_parts.join("/") + "/";

        if (fs.exists(test_path + "login_credentials.txt")) {
            var text = fs.read(test_path + "login_credentials.txt");
            var lines = text.split(/\r\n|[\r\n]/g);
            username = lines[1];
            password = lines[3];
        }
        if (username == "[Your Username Here]" || username == "" &&
            password == "[Your Password Here]" || username == "") 
        {
            system.stdout.writeLine("Username: ");
            username = system.stdin.readLine();
            system.stdout.writeLine("Password: ");
            password = system.stdin.readLine();
            system.stdout.write("\x1b[1APassword                           \n");
        }
    });

    //Click on menu item
    var selector = "#publish_notebook > a";
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
        this.fillSelectors("form#publish_form > fieldset#fields1", {
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
        this.fill("form#publish_form > fieldset#fields1", {
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
        this.fill("form#publish_form > fieldset#fields1", {
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
        this.fill("form#publish_form > fieldset#fields1", {
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
        this.fill("form#publish_form > fieldset#fields1", {
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
        this.fill("form#publish_form > fieldset#fields1", {
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
        this.fillSelectors("form#publish_form > fieldset#fields1", { 
            "#title": "My Title",
            "#nb-abstract": "My abstract",
            "#year": "1995",
            "#month": "8",
            "#day": "20",
            "#language": "en",
            "#tags": "tag1\ntag2",
            "#author-last-name-0": "Davies",
            "#author-first-name-0": "Louise",
            "#author-last-name-2": "S'chn T'gai",
            "#author-first-name-2": "Spock",
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
        this.fillSelectors("form#publish_form > fieldset#fields2", {
            "#repository": "edata/8", //the handle for SCD
            "#nb-licence-dropdown": "Other"
        });
    });

    //TODO: test licence file stuff

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
        var licence_file_disabled = this.evaluate(function() {
            return $("#licence-file").prop("disabled");
        });
        this.test.assert(licence_file_disabled, "#licence-file is disabled when url is selected");

        var licence_file_button_disabled = this.evaluate(function() {
            return $("#licence-file-button").attr("disabled");
        });
        this.test.assertNotEquals(licence_file_button_disabled, undefined, "#licence-file-button is disabled when url is selected");
    });

    this.thenClick("#licence-file-radio");
    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#no-licence-file-error",
                               "File missing error exists");
        var licence_url_disabled = this.evaluate(function() {
            return $("#licence-url").prop("disabled");
        });
        this.test.assert(licence_url_disabled, "#licence-url is disabled when file is selected");
    });

    this.then(function() {
        this.page.uploadFile("#licence-file",test_path + "Test.txt");
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
        this.fillSelectors("form#publish_form > fieldset#fields2", {
            "#publisher": "test publisher",
            "#nb-citation-0": "Citation 1",
            "#nb-citation-2": "Citation 2",
            "#nb-referencedBy-0": "URL1",
            "#nb-referencedBy-2": "URL2"
        });
    }); //TODO: add funders and sponsors if we can use them
    this.thenClick("#next");

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
                    repository: ""
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
                    repository: md.reportmetadata.repository
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
            [["Davies","Louise"],["S'chn T'gai","Spock"]],
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
    });

    this.thenClick("#next");
    //if it doesn't show, this will fail, so no need to make an assertion
    this.waitUntilVisible(".login-error");

    this.then(function() {
        this.evaluate(function() {
            $("#username").val("fakeusername");
            $("#password").val("not a real password");
        });
    });

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        this.evaluate(function(un,pw) {
            $("#username").val(un);
            $("#password").val(pw);
        }, username, password);
    });

    this.thenClick("#next");

    var alert = ".alert";
    this.waitForSelector(alert);
    this.then(function() {
        this.test.assertExists(".nb-upload-success-alert",
                               "Notebook upload success alert seen");
    });
    
    var id = "";

    this.then(function() {
        this.evaluate(function(un,pw) {
            var id_url = $(".nb-upload-success-alert").attr("item-id");
            var nb_utils = require("base/js/utils");
            var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                     "/dspace/findid");
            var settings = {
                processData : false,
                cache : false,
                type : "POST",
                contentType: "application/json",
                data: JSON.stringify({"ID":id_url,
                                      "username": un,
                                      "password": pw}),
            };
            var request = nb_utils.promising_ajax(request_url, settings);
            request.then(function(result) {
                $(document.body).append($("<div/>")
                                            .attr("id","test-item-id")
                                            .attr("item-id",result.id));
            });
        }, username, password);
    });

    this.waitForSelector("#test-item-id");


    this.then(function() {
        id = this.getElementAttribute("#test-item-id","item-id");
        this.test.assertNotEquals(
            id,
            null,
            "The item exists in DSpace with the ID " + id
        );
    });

    this.then(function() {
        this.evaluate(function(id,un,pw) {
            var nb_utils = require("base/js/utils");
            var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                     "/dspace/getbistreams");
            var settings = {
                processData : false,
                cache : false,
                type : "POST",
                contentType: "application/json",
                data: JSON.stringify({"ID":id, "username": un, "password": pw}),
            };
            var request = nb_utils.promising_ajax(request_url, settings);

            request.then(function(result) {
                for (var key in result) {
                    var item = result[key];
                    //don't check the license or sword package file because cba
                    //(if they're wrong it's something wrong with SWORD and not me)
                    if(item.bundleName === "ORIGINAL") { 
                        $(document.body).append($("<div/>")
                                                    .addClass("test-bitstream-id")
                                                    .attr("item-id",item.id));
                    }
                }
            });
        }, id,username,password);
    });

    this.waitForSelector(".test-bitstream-id");

    this.then(function() {
        this.evaluate(function(un,pw) {
            var bitstreams = $(".test-bitstream-id");
            var IDs = [];
            bitstreams.each(function(index,item) {
                IDs.push($(item).attr("item-id"));
            });
            var nb_utils = require("base/js/utils");
            var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                     "/dspace/getbistreamdata");
            var settings = {
                processData : false,
                cache : false,
                type : "POST",
                contentType: "application/json",
                data: JSON.stringify({"IDs":IDs,
                                      "username": un,
                                      "password": pw}),
            };
            var request = nb_utils.promising_ajax(request_url, settings);

            request.then(function(result) {
                for (var key in result) {
                    $(document.body).append($("<div/>")
                                                .addClass("test-bitstream-content")
                                                .attr("bitstream-content",result[key]));
                }
            });
        }, username, password);
    });

    this.waitForSelector(".test-bitstream-content");

    this.then(function() {
        var bitstream_data = this.getElementsAttribute(".test-bitstream-content",
                                                       "bitstream-content");

        this.test.assertNotEquals(
            bitstream_data.indexOf("This is a test file\n"),
            -1,
            "LICENSE.txt has correct content"
        );
    });

    var delete_once_finished = true; //used for testing the test

    if (delete_once_finished) {
        this.then(function() {
            this.evaluate(function(id,un,pw) {
                var nb_utils = require("base/js/utils");
                var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                         "/dspace/delete");
                var settings = {
                    processData : false,
                    type : "POST",
                    contentType: "application/json",
                    data: JSON.stringify({"ID":id,
                                          "username": un,
                                          "password": pw}),
                };
                var request = nb_utils.promising_ajax(request_url, settings);

                request.then(function(result) {
                    $(document.body).append($("<div/>")
                                                .attr("id","test-delete-status")
                                                .attr("status-code",result));
                });
            }, id,username,password);
        });

        this.waitForSelector("#test-delete-status");

        this.then(function() {
            var delete_status_code = this.getElementAttribute("#test-delete-status",
                                                              "status-code");
            this.test.assertEquals(
                delete_status_code,
                "404",
                "Item not found in DSpace so successfully deleted"
            );
        });
    }
});