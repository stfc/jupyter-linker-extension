var system = require("system");
var fs = require("fs");

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the publish data button and dialog");

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

    var nbname = "Untitled.ipynb";

    this.thenEvaluate(function (nbname) {
        require(["base/js/events"], function (events) {
            Jupyter.notebook.set_notebook_name(nbname);
            var md = Jupyter.notebook.metadata;
            md.reportmetadata = {
                "abstract": "A test item generated by upload_bundle_to_dspace.js" + 
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
                "title": "BUNDLE TO BE DELETED",
                "repository": "edata/8",
                "publisher":"Publisheroni",
                "citations":[
                  "citation1",
                  "citation2",
                ],
                "licence": {
                  "preset":"CCO",
                  "url": ""
                }
            };
            md.databundle = [
                {
                  "type": "directory",
                  "mimetype": null,
                  "format": "json",
                  "content": [
                    {
                      "type": "directory",
                      "mimetype": null,
                      "format": null,
                      "content": null,
                      "path": "sub ∂ir1/sub ∂ir 1a",
                      "writable": true,
                      "name": "sub ∂ir 1a",
                    },
                    {
                      "type": "file",
                      "mimetype": null,
                      "format": null,
                      "content": null,
                      "path": "sub ∂ir1/file_in_sub_∂ir1.txt",
                      "writable": true,
                      "name": "file_in_sub_∂ir1.txt",
                    }
                  ],
                  "path": "sub ∂ir1",
                  "writable": true,
                  "name": "sub ∂ir1",
                },
                {
                  "type": "file",
                  "mimetype": "text/plain",
                  "format": "text",
                  "content": "",
                  "path": "file_in_nbdir.txt",
                  "writable": true,
                  "name": "file_in_nbdir.txt",
                },
                {
                  "type": "directory",
                  "mimetype": null,
                  "format": "json",
                  "content": [
                    {
                      "type": "file",
                      "mimetype": null,
                      "format": null,
                      "content": null,
                      "path": "sub ∂ir1/sub ∂ir 1a/file_in_sub_∂ir1a.txt",
                      "writable": true,
                      "name": "file_in_sub_∂ir1a.txt",
                    }
                  ],
                  "path": "sub ∂ir1/sub ∂ir 1a",
                  "writable": true,
                  "name": "sub ∂ir 1a",
                },
                {
                  "type": "file",
                  "mimetype": "text/plain",
                  "format": "text",
                  "content": "",
                  "path": "sub ∂ir1/file_in_sub_∂ir1.txt",
                  "writable": true,
                  "name": "file_in_sub_∂ir1.txt",
                },
                {
                  "type": "file",
                  "mimetype": "text/plain",
                  "format": "text",
                  "content": "",
                  "path": "sub ∂ir1/sub ∂ir 1a/file_in_sub_∂ir1a.txt",
                  "writable": true,
                  "name": "file_in_sub_∂ir1a.txt",
                }
            ];
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
    var selector = "#publish_bundle > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    //add check here for dialog correctness
    this.waitForSelector("#data-abstract");
    this.wait(1000); //need to wait for modal to be fully visible
    
    this.then(function() {
        var test_textarea_val = this.evaluate(function() {
            return $("#data-abstract").val();
        });
        var correct_textarea_str = "file_in_nbdir.txt\n\n" + 
                                   "file_in_sub_∂ir1.txt\n\n" +
                                   "file_in_sub_∂ir1a.txt";
        this.test.assertEquals(test_textarea_val,
                               correct_textarea_str,
                               "Default string in abstract form field correct");
    });

    this.thenClick(".btn-primary");
    this.then(function() {
        this.test.assertVisible("#TOS-missing-error",
                                "TOS missing error showing correctly");
        this.test.assertVisible("#copyright-missing-error",
                                "Copyright missing error showing correctly");
    });

    //this.wait(250);

    this.thenClick("#add-data-referencedBy-button");
    this.then(function() {
        this.evaluate(function() {
            $("#data-referencedBy-0").val("URL1");
            $("#data-referencedBy-1").val("URL2");
            $("#data-citation-0").val("Citation");
            $("#copyright").val("Copyright");
        });
    });

    this.then(function() {
        this.page.uploadFile("#TOS",test_path + "Test.txt");
    });

    this.thenClick("#next");
    this.waitForSelector("#username");
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
        this.test.assertExists(".data-upload-success-alert",
                               "Data upload success alert seen");
    });

    //check that we got the url reference back
    this.then(function() {
        var bundle_url_exists = this.evaluate(function() {
            return ("databundle_url" in Jupyter.notebook.metadata);
        });

        this.test.assert(bundle_url_exists,"databundle_url exists in metadata");

        var bundle_url = this.evaluate(function() {
            return Jupyter.notebook.metadata.databundle_url;
        });

        this.test.assertTruthy(bundle_url,"databundle_url is not empty");
    });
    
    var id = "";

    this.then(function() {
        this.evaluate(function(un,pw) {
            var id_url = $(".alert-success").attr("item-id");
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
        this.test.assertNotEquals(id,null,"The item exists in DSpace with the ID " + id);
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
        this.echo(bitstream_data);

        this.test.assertNotEquals(
            bitstream_data.indexOf("Text in file_in_nbdir.txt"),
            -1,
            "file_in_nbdir.txt has correct content"
        );
        this.test.assertNotEquals(
            bitstream_data.indexOf("Text in file_in_sub_dir1.txt"),
            -1,
            "file_in_sub_dir1.txt has correct content"
        );
        this.test.assertNotEquals(
            bitstream_data.indexOf("Text in file_in_sub_dir1a.txt"),
            -1,
            "file_in_sub_dir1a.txt has correct content"
        );
        this.test.assertNotEquals(
            bitstream_data.indexOf("This is a test file\n"),
            -1,
            "TOS 0.txt has correct content"
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