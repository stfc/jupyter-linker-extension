var system = require("system");
var fs = require("fs");
var screenshot_dir = "screenshots/associated/";

casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing the associated data dialog");

    var screenshot_index = 1;
    
    function take_screenshot(name) {
    	var index_string = screenshot_index.toString();
        casper.then(function () {
            casper.capture(screenshot_dir + index_string +
            		       ". " + name + ".png");
        });
        
        screenshot_index++;
    }
    
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

    var nbname = "test_associated_data.ipynb";

    //Click on menu item
    var selector = "#manage_associated_data > a";
    this.waitForSelector(selector);
    this.thenClick(selector);
    
    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");

    //add check here for dialog correctness, also to wait for files to be loaded
    this.waitForSelector("#files-loading-associated");
    this.waitWhileVisible("#files-loading-associated");

    this.then(function() {
        this.test.assertExists(".modal-body",
                               "Dialogue successfully opened");
    });
    take_screenshot("open-dialogue");
    
    this.thenEvaluate(function() {
        $("#file-tree-associated li > a[title=\"file_in_nbdir.txt\"]").prev(".button.chk").click();
        $("#file-tree-associated li > a[title=\"sub ∂ir1\"]").prev(".button.chk").click();
    });
    
    this.waitForSelector("#files-loading-associated");
    this.waitWhileVisible("#files-loading-associated");
    
    this.waitFor(function check() {
        return this.evaluate(function() {
            return ($("#file-tree-associated li > a[title=\"file_in_nbdir.txt\"]").prev(".button.chk").hasClass("checkbox_true_full"));
        });
    }, function success() { //success
        this.test.assert(true,"Successfully selected files");
    }, function fail() {
        this.test.assert(false,"Failure selecting files");
    }, 10000);
    
    take_screenshot("files-selected");

    this.waitForSelector("#select");
    this.thenClick("#select");
    
    this.waitFor(function () {
    	return !this.exists(".modal-body"); 
    }, function success() { //success
        this.test.assert(true,"Successfully closed dialogue");
    }, function fail() {
        this.test.assert(false,"Dialogue would not close");
    }, 10000);
    
    take_screenshot("dialogue-closed");
    
    //Re-open menu item
    var selector = "#manage_associated_data > a";
    this.waitForSelector(selector);
    this.thenClick(selector);
    
    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");

    //add check here for dialog correctness, also to wait for files to be loaded
    this.waitForSelector("#files-loading-associated");
    this.waitWhileVisible("#files-loading-associated");

    this.then(function() {
        this.test.assertExists(".modal-body",
                               "Dialogue successfully re-opened");
    });
    take_screenshot("reopen-dialogue");
    
    this.waitFor(function check() {
        return this.evaluate(function() {
            return ($("#file-tree-associated li > a[title=\"file_in_nbdir.txt\"]").prev(".button.chk").hasClass("checkbox_true_full"));
        });
    }, function success() { //success
        this.test.assert(true,"Text file still selected on re-open");
    }, function fail() {
        this.test.assert(false,"Text file no longer selected on re-open");
    }, 10000);
    
    this.waitFor(function check() {
        return this.evaluate(function() {
            return ($("#file-tree-associated li > a[title=\"file_in_sub_∂ir1.txt\"]").prev(".button.chk").hasClass("checkbox_true_full"));
        });
    }, function success() { //success
        this.test.assert(true,"Directory selected on re-open");
    }, function fail() {
        this.test.assert(false,"Directory no longer selected on re-open");
    }, 10000);
});
