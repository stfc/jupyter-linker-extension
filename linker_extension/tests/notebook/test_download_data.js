var system = require("system");
var fs = require("fs");
var screenshot_dir = "screenshots/download_data/";

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
    
    var screenshot_index = 1;
    
    function take_screenshot(name) {
    	var index_string = screenshot_index.toString();
        casper.then(function () {
            casper.capture(screenshot_dir + index_string +
            		       ". " + name + ".png");
        });
        screenshot_index++;
    }

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
    
    var items = ["https://epublicns05.esc.rl.ac.uk/handle/edata/3817",
                 "https://epublicns05.esc.rl.ac.uk/handle/edata/31",
                 "https://epublicns05.esc.rl.ac.uk/handle/edata/3744",
                 "https://epublicns05.esc.rl.ac.uk/handle/edata/26",
                 "https://epublicns05.esc.rl.ac.uk/handle/edata/3759",];
    
    //Click on menu item
    var selector = "#download_data > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    take_screenshot("modal-open");

    this.then(function() {
        this.test.assertExists(".modal-body", "Modal successfully created");
    });

    this.then(function() {
        this.fillSelectors("#download_data_form", {
            "#dspace-url-0": items[0], //this passes the regex, but will fail because the item doesn't exist. Use this to test fail behaviour
        });
    });

    this.waitForSelector("#download");
    this.thenClick("#download");
    take_screenshot("login-error");
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

    take_screenshot("password-missing");
    
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

    take_screenshot("username-missing");
    
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

    take_screenshot("invalid-username");
    
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

    take_screenshot("incorrect-combination");
    
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

    //check that we see the alerts
    var alert = ".alert";
    this.waitForSelector(alert);
    
    take_screenshot("alerts");
    this.then(function() {
        var successes = this.evaluate(function() {
            return $(".download-success-alert").length;
        });
        this.test.assertEquals(successes, 1, "Success alert seen");
    });
   
    //Try to download a mixture of successful and failed items.
    //Click on menu item
    var selector = "#download_data > a";
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    take_screenshot("modal-open");

    this.then(function() {
        this.test.assertExists(".modal-body", "Modal successfully created");
    });
    
    this.thenClick("#add-url-button");
    this.thenClick("#add-url-button");
    this.thenClick("#add-url-button");
    this.thenClick("#add-url-button");
    
    this.then(function() {
        this.test.assertExists("#dspace-url-4",
                               "Additional URLs successfully created");
    });

    this.then(function() {
        this.fillSelectors("#download_data_form", {
            "#dspace-url-0": "https://epublicns05.esc.rl.ac.uk/handle/edata/99999999999", //this passes the regex, but will fail because the item doesn't exist. Use this to test fail behaviour
            "#dspace-url-1": items[1],
            "#dspace-url-2": items[2],
            "#dspace-url-3": items[3],
            "#dspace-url-4": items[4],
        });
    });
    
    take_screenshot("5-items-filled");
    
    this.then(function() {
        this.evaluate(function(un,pw) {
            $("#username").val(un);
            $("#password").val(pw);
        }, username, password);
    });
    
    this.thenClick("#download");

    //check that we see the alerts
    var alert = ".alert";
    this.waitForSelector(alert);
    
    take_screenshot("alerts");
    this.then(function() {
        var successes = this.evaluate(function() {
            return $(".download-success-alert").length;
        });
        var failures = this.evaluate(function() {
            return $(".download-failure-alert").length;
        });
        this.test.assertEquals(successes, 4, "4 success alerts seen");
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
            "https://epublicns05.esc.rl.ac.uk/handle/edata/99999999999",
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
});