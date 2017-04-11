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

    var nbname = "redownload_data_overwrite.ipynb";

    //fill in some dummy metadata
    this.thenEvaluate(function (nbname) {
        require(["base/js/events"], function (events) {
            Jupyter.notebook.set_notebook_name(nbname);
            var md = Jupyter.notebook.metadata;
            md.reportmetadata = {
                "abstract": "A test item generated by redownload_data_overwrite.js" + 
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
                "department": "12",
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

    //add check here for dialog correctness, also to wait for files to be loaded
    this.waitForSelector("#files-loading");
    this.waitWhileVisible("#files-loading");

    //select files for test
    this.thenEvaluate(function() {
        $("#file-tree li > a[title=\"file_in_nbdir.txt\"]").prev(".button.chk").click();
        $("#file-tree li > a[title=\"sub ∂ir1\"]").prev(".button.chk").click();
    });

    this.waitForSelector("#files-loading");
    this.waitWhileVisible("#files-loading");

    this.thenClick("#next");

    this.then(function() {
        this.evaluate(function() {
            $("#data-citation-0").val("Citation");
            $("#copyright").val("Copyright");
            $("#data-licence-dropdown").val("");
        });
    });

    this.then(function() {
        this.page.uploadFile("#TOS",test_path + "Test.txt");
    });

    this.then(function() {
        this.evaluate(function() {
            $("#data-licence-dropdown").val("MIT");
        });
    });

    this.thenClick("#next");

    this.waitForSelector("#username");

    this.then(function() {
        this.evaluate(function(un,pw) {
            $("#username").val(un);
            $("#password").val(pw);
        }, username, password);
    });

    this.thenClick("#next");

    //check that we see the success alert
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

    //find the item in dspace by id
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

    this.thenEvaluate(function() {
        var contents = Jupyter.notebook.contents;
        //delete a file so we can check download actually works!
        contents.list_contents("/").then(function(response) {
            response.content.forEach(function(item) {
                if(item.name === "file_in_nbdir.txt") {
                    $(document.body).append($("<div/>")
                                    .attr("id","file-in-nbdir-timestamp")
                                    .attr("timestamp",item.last_modified));
                }
            });
        });
        contents.list_contents("/sub ∂ir1/sub ∂ir 1a").then(function(response) {
            response.content.forEach(function(item) {
                if(item.name === "file_in_sub_∂ir1a.txt") {
                    $(document.body).append($("<div/>")
                                    .attr("id","sub-∂ir-1a-timestamp")
                                    .attr("timestamp",item.last_modified));
                }
            });
        });
        contents.delete("/sub ∂ir1/file_in_sub_∂ir1.txt").then(function() {
            return contents.list_contents("/");
        }).then(function(response) {
            $(document.body).append($("<div/>")
                                    .attr("id","sub-∂ir1-contents")
                                    .attr("items",JSON.stringify(response.content)));
        });
    });

    this.waitForSelector("#sub-∂ir1-contents");
    this.then(function() {
        var directory_contents_str = this.getElementAttribute("#sub-∂ir1-contents","items");
        var directory_contents = JSON.parse(directory_contents_str);
        var deleted_item_not_found = true;
        directory_contents.forEach(function(item) {
            if(item.name === "file_in_sub_∂ir1.txt") {
                deleted_item_not_found = false;
            }
        });
        this.test.assert(deleted_item_not_found,"file_in_sub_∂ir1.txt successfully deleted");
    });

    this.thenClick("#redownload_data > a");
    //button is only given id when the modal is fully loaded, so wait for button
    //to wait for entire modal load
    this.waitForSelector("#download");
    this.thenClick("#filename-collision-behaviour-overwrite");

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

    this.then(function() {
        this.evaluate(function(pw) {
            $("#password").val(pw);
        }, password);
    });

    this.thenClick("#download");

    //check that we see the alert
    this.waitForSelector(alert);
    this.waitWhileVisible(".modal");
    this.waitWhileVisible(".modal-backdrop");
    this.then(function() {
        this.capture("screenshots/redownload_alert.png");
        var successes = this.evaluate(function() {
            return $(".download-success-alert").length;
        });
        var failures = this.evaluate(function() {
            return $(".download-failure-alert").length;
        });
        this.test.assertEquals(successes, 1, "Success alert seen");
        this.test.assertEquals(failures, 0 , "No failure alert seen");
    });

    this.thenEvaluate(function() {
        var contents = Jupyter.notebook.contents;
        //delete a file so we can check download actually works!
        contents.list_contents("/").then(function(response) {
            $(document.body).append($("<div/>")
                                    .attr("id","directory-contents")
                                    .attr("items",JSON.stringify(response.content)));
        });
        contents.list_contents("/sub ∂ir1").then(function(response) {
            $(document.body).append($("<div/>")
                                    .attr("id","sub-∂ir1-contents-after-download")
                                    .attr("items",JSON.stringify(response.content)));
        });
        contents.list_contents("/sub ∂ir1/sub ∂ir 1a").then(function(response) {
            $(document.body).append($("<div/>")
                                    .attr("id","sub-∂ir-1a-contents")
                                    .attr("items",JSON.stringify(response.content)));
        });
    });

    this.waitForSelector("#file-in-nbdir-timestamp");
    this.waitForSelector("#directory-contents");
    this.then(function() {
        var directory_contents_str = this.getElementAttribute("#directory-contents","items");
        var directory_contents = JSON.parse(directory_contents_str);
        var newer_timestamp = false;
        directory_contents.forEach(function(item) {
            if(item.name === "file_in_nbdir.txt") {
                var old_date = new Date(casper.getElementAttribute("#file-in-nbdir-timestamp","timestamp"));
                var new_date = new Date(item.last_modified);
                if(new_date > old_date) {
                    newer_timestamp = true;
                }
            }

        });
        this.test.assert(newer_timestamp,"file_in_nbdir.txt successfully downloaded and overwritten");
    });

    this.waitForSelector("#sub-∂ir1-contents-after-download");
    this.then(function() {
        var directory_contents_str = this.getElementAttribute("#sub-∂ir1-contents-after-download","items");
        var directory_contents = JSON.parse(directory_contents_str);
        var deleted_item_found = false;
        directory_contents.forEach(function(item) {
            if(item["name"] === "file_in_sub_∂ir1.txt") {
                deleted_item_found = true;
            }

        });
        this.test.assert(deleted_item_found,"file_in_sub_∂ir1.txt successfully downloaded");
    });

    this.waitForSelector("#sub-∂ir-1a-timestamp");
    this.waitForSelector("#sub-∂ir-1a-contents");
    this.then(function() {
        var directory_contents_str = this.getElementAttribute("#sub-∂ir-1a-contents","items");
        var directory_contents = JSON.parse(directory_contents_str);
        var newer_timestamp = false;
        directory_contents.forEach(function(item) {
            if(item.name === "file_in_sub_∂ir1a.txt") {
                var old_date = new Date(casper.getElementAttribute("#sub-∂ir-1a-timestamp","timestamp"));
                var new_date = new Date(item.last_modified);
                if(new_date > old_date) {
                    newer_timestamp = true;
                }
            }

        });
        this.test.assert(newer_timestamp,"file_in_sub_∂ir1a.txt successfully downloaded and overwritten");
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
});
