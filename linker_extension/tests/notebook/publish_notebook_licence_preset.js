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

    this.evaluate(function() {
        var nb_utils = require("base/js/utils");
        var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                 "/linker_config");
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            contentType: "application/json",
            data: JSON.stringify({"username": ""}),
        };
        var request = nb_utils.promising_ajax(request_url, settings);
    });
    
    //we need username and password to authenticate with dspace
    //so either read the info via the login_credentials text file
    //or prompt the user for their username and password
    this.then(function() {
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

    this.waitForSelector("#communities_loaded"); //feels dirty...

    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#licence-dropdown-error",
                               "Licence dropdown invalid error exists");
        this.test.assertExists("#department-missing-error",
                               "Department missing error exists");
        this.test.assertExists("#repository-missing-error",
                               "Repository missing error exists");
    });

    this.then(function(){
        this.fillSelectors("form#publish_form > fieldset#fields2", {
            "#department": "12",
            "#nb-licence-dropdown": "Other"
        });
    });

    this.waitForSelector("#collections_loaded");

    this.then(function() {
        this.fill("form#publish_form > fieldset#fields2", {
            "repository": "edata/8",
        });
    });

    this.thenClick("#next");
    this.then(function() {
        this.test.assertExists("#no-licence-error",
                               "No checkbox selected error exists");
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
            "#nb-licence-dropdown": "MIT",
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
                    department: "",
                    repository: "",
                    licence_preset: "",
                    licence_url: "",
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
                    licence_url: md.reportmetadata.licence_url,
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
            "MIT",
            "Licence has been set correctly"
        );
        this.test.assertEquals(
            metadata.licence_url,
            "",
            "licence_url has been set correctly"
        );
    });

    //test login errors

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        var msg = this.evaluate(function() {
            return $(".login-error").text();
        });
        this.test.assertEquals(
            msg,
            "Please enter a username and password",
            "Username and password missing error correct");
    });

    this.then(function() {
        this.evaluate(function() {
            $("#username").val("fakeusername");
        });
    });

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        var msg = this.evaluate(function() {
            return $(".login-error").text();
        });
        this.test.assertEquals(
            msg,
            "Please enter a password",
            "Password missing error correct");
    });

    this.then(function() {
        this.evaluate(function() {
            $("#username").val("");
            $("#password").val("not a real password");
        });
    });

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        var msg = this.evaluate(function() {
            return $(".login-error").text();
        });
        this.test.assertEquals(
            msg,
            "Please enter a username",
            "Username missing error correct");
    });

    this.then(function() {
        this.evaluate(function() {
            $("#username").val("bad*username");
            $("#password").val("not a real password");
        });
    });

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        var msg = this.evaluate(function() {
            return $(".login-error").text();
        });
        this.test.assertEquals(
            msg,
            "Invalid username. If the error persists, please contact the developers",
            "Invalid username error correct");
    });

    this.then(function() {
        this.evaluate(function() {
            $("#username").val("fakeusername");
            $("#password").val("not a real password");
        });
    });

    this.thenClick("#next");
    this.waitUntilVisible(".login-error");

    this.then(function() {
        var msg = this.evaluate(function() {
            return $(".login-error").text();
        });
        this.test.assertEquals(
            msg,
            "The username and password combination " +
            "entered is incorrect - please try " +
            "again. If the error persists, please " +
            "contact the developers",
            "Invalid login error correct");
    });

    this.then(function() {
        this.evaluate(function(un,pw) {
            $("#username").val(un);
            $("#password").val(pw);
        }, username, password);
    });

    this.thenClick("#next");

    this.then(function() {
        this.test.assertNotVisible(".login-error","Login validation correct");
    });

    //check that we see the success alert
    var alert = ".alert";
    this.waitForSelector(alert);
    this.then(function() {
        this.test.assertExists(".nb-upload-success-alert",
                               "Notebook upload success alert seen");
    });

    //find the item in dspace by id
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

    //get the bitstreams of the item

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

    //get the content from the bistreams

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

    //test that the bitstream content is correct
    this.then(function() {
        var bitstream_data = this.getElementsAttribute(".test-bitstream-content",
                                                       "bitstream-content");
        var MIT = 
            "Copyright (c) <year> <copyright holders>\n\n"+
            "Permission is hereby granted, free of charge, to any person obtaining a copy\n"+
            "of this software and associated documentation files (the \"Software\"), to deal\n"+
            "in the Software without restriction, including without limitation the rights\n"+
            "to use, copy, modify, merge, publish, distribute, sublicense, and\/or sell\n"+
            "copies of the Software, and to permit persons to whom the Software is\n"+
            "furnished to do so, subject to the following conditions:\n\n"+
            "The above copyright notice and this permission notice shall be included in all\n"+
            "copies or substantial portions of the Software.\n\n"+
            "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n"+
            "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n"+
            "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n"+
            "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n"+
            "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n"+
            "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n"+
            "SOFTWARE.\n";

        this.test.assertNotEquals(
            bitstream_data.indexOf(MIT),
            -1,
            "LICENSE.txt has correct content"
        );
    });

    var delete_once_finished = true; //used for testing the test

    //delete the item in dspace so we don't clutter up the test server
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

    /* 
     * test that username is refilled from config - this tests both the
     * saving of username to config after a successful request and refilling
     * from config when trying to send a new request
     */

    //Click on menu item
    selector = "#publish_notebook > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    this.waitForSelector(".modal");
    this.wait(1000); //need to wait for modal to be fully visible

    this.then(function() {
        var config_username = this.evaluate(function() {
            return $("#username").val();
        });

        this.test.assertEquals(
            config_username,
            username,
            "Username refilled from config"
        );
    });
});