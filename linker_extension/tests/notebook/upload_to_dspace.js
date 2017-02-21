var system = require("system");
var fs = require("fs");

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing uploading notebook to DSpace");

    this.viewport(1280, 720);

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

    //wait for notebook to load
    this.waitFor(this.kernel_running);
    this.waitFor(function() {
        return this.evaluate(function () {
            return Jupyter && Jupyter.notebook && true;
        });
    });

    var nbname = "Untitled.ipynb";

    this.thenEvaluate(function (nbname) {
        require(["base/js/events"], function (events) {
            Jupyter.notebook.set_notebook_name(nbname);
            var md = Jupyter.notebook.metadata;
            md.reportmetadata = {
                "abstract": "A test item generated by upload_to_dspace.js " + 
                            "If you can see this then the delete part of the " + 
                            "test isn't working",
                "referencedBy": [
                  "Test"
                ],
                "tags": [
                  "Test"
                ],
                "language": "en",
                "authors": [
                  [
                    "McTestface",
                    "Testy"
                  ]
                ],
                "date": "2016-11-14",
                "title": "TO BE DELETED",
                "department": "12",
                "repository": "edata/8",
                "publisher":"Publisheroni",
                "citations":[
                  "citation1",
                  "citation2",
                ],
                "funders":"",
                "licence_preset": "MIT",
                "licence_url": "",
            };
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

    //Click on menu item
    var selector = "#sword_new_item > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    this.waitForSelector(".modal");
    this.wait(1000); //need to wait for modal to be fully visible

    //test login errors

    this.thenClick(".btn-primary");
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

    this.thenClick(".btn-primary");
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

    this.thenClick(".btn-primary");
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

    this.thenClick(".btn-primary");
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

    this.thenClick(".btn-primary");
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

    this.thenClick(".btn-primary");

    this.then(function() {
        this.test.assertNotVisible(".login-error","Login validation correct");
    });

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
    selector = "#sword_new_item > a";
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
