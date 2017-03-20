var system = require("system");
var fs = require("fs");

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the download data button and dialog");

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
    var selector = "#download_data > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that certain fields are required 
    this.waitForSelector("#download");
    this.thenClick("#download");

    this.then(function() {
        this.test.assertExists(".download-form-error",
                               "Not valid url error exists");
    });

    this.then(function() {
        var items = this.evaluate(function(un,pw) {
            var nb_utils = require("base/js/utils");
            var request_url = nb_utils.url_path_join(Jupyter.notebook.base_url,
                                                     "/dspace/listitems");
            var settings = {
                processData : false,
                cache : false,
                type : "POST",
                contentType: "application/json",
                data: JSON.stringify({"username": un,
                                      "password": pw}),
            };
            var request = nb_utils.promising_ajax(request_url, settings);
            request.then(function(result) {
                $(document.body).append($("<div/>")
                                        .attr("id","test-list-items-result")
                                        .attr("item-list",result));
            });
        }, username, password);
    });

    var items;
    this.wait(500);
    this.then(function() {
        items = JSON.parse(this.evaluate(function() {
            return $("#test-list-items-result").attr("item-list");
        }));
    });

    var item1;
    var item2;
    var item3;
    var item4;
    var item5;

    this.then(function() {
        var randomPop = function(arr) {
            return arr.splice(Math.floor(Math.random() * arr.length),1)[0]; 
        };
        var getHandle = function() {
            while(true) {
                var handle = randomPop(items)["handle"];
                //ignore the null item
                if(handle !== null) {
                    return handle;
                }
            }
        };
        item1 = "https://epublicns05.esc.rl.ac.uk/handle/" + getHandle();
        item2 = "https://epublicns05.esc.rl.ac.uk/handle/" + getHandle();
        item3 = "https://epublicns05.esc.rl.ac.uk/handle/" + getHandle();
        item4 = "https://epublicns05.esc.rl.ac.uk/handle/" + getHandle();
        item5 = "https://epublicns05.esc.rl.ac.uk/handle/" + getHandle();
    });
    
    
    this.thenClick("#add-download-url-button");
    this.thenClick("#add-download-url-button");
    this.thenClick("#add-download-url-button");
    this.thenClick("#add-download-url-button");
    this.thenClick("#add-download-url-button");

    this.then(function() {
        this.fillSelectors("#download-urls", {
            "#download-url-0": "https://epublicns05.esc.rl.ac.uk/handle/edata/99999999999", //this passes the regex, but will fail because the item doesn't exist. Use this to test fail behaviour
            "#download-url-1": item1,
            "#download-url-2": item2,
            "#download-url-3": item3,
            "#download-url-4": item4,
            "#download-url-5": item5,
        });
        this.capture("screenshots/random_items.png");
    });

    //test login errors
    this.then(function() {
        this.capture("screenshots/before_login_error.png");
    });
    this.thenClick("#download");
    this.then(function() {
        this.capture("screenshots/login_error.png");
    });
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");

    this.then(function() {
        this.test.assertNotVisible(".login-error","Login validation correct");
    });

    //check that we see the alerts
    var alert = ".alert";
    this.waitForSelector(alert);
    this.then(function() {
        this.capture("screenshots/alerts.png");
        var successes = this.evaluate(function() {
            return $(".download-success-alert").length;
        });
        var failures = this.evaluate(function() {
            return $("download-failure-alert").length;
        });
        this.test.assertEquals(successes, 5, "5 success alerts seen");
        this.test.assertEquals(failures, 1 , "1 failure alert seen");
        this.test.assertExists(".download-redownload-alert","Re-download alert seen");
    });

    this.thenClick("#redownload-link");
    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    this.then(function() {
        var redownload = this.evaluate(function() {
            return $("#download-url-0").val();
        });
        this.test.assertEquals(
            redownload,
            "https://epublicns05.esc.rl.ac.uk/handle/edata/3210",
            "Re-download dialog refilled correctly");
    });

    /* 
     * test that username is refilled from config - this tests both the
     * saving of username to config after a successful request and refilling
     * from config when trying to send a new request
     */
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

    /*
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
            "Other",
            "Licence has been set correctly"
        );
        this.test.assertEquals(
            metadata.licence_url,
            "",
            "licence_url has been set correctly"
        );
    });

    //test login errors

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");
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

    this.thenClick("#download");

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

        this.test.assertNotEquals(
            bitstream_data.indexOf("This is a test file\n"),
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
     *//*

    //Click on menu item
    selector = "#publish_notebook > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    this.waitForSelector(".modal");
    this.wait(200); //need to wait for modal to be fully visible

    this.thenClick(".btn-primary");

    this.waitForSelector(".modal");
    this.wait(200); //need to wait for modal to be fully visible

    this.then(function() {
        var config_username = this.evaluate(function() {
            return $("#username").val();
        });

        this.test.assertEquals(
            config_username,
            username,
            "Username refilled from config"
        );
    });*/
});