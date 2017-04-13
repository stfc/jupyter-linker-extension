define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "../custom_utils",
        "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_contents,custom_utils){

    var download_data = function(failed_downloads) {

        var download_urls = $("<div/>").attr("id","download-urls");

        var download_url_container = $("<div/>").addClass("download-url-container");

        var download_url = $("<input/>")
            .addClass("download-url")
            .attr("type","text")
            .attr("name","download url")
            .attr("id","download-url-0");

        var add_download_URL_button = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-download-url-button")
            .attr("id","add-download-url-button")
            .attr("type","button")
            .attr("aria-label","Add download URL")
            .click(function() {
                addDownloadURL();
            });

        add_download_URL_button.append($("<i>").addClass("fa fa-plus"));

        download_url_container.append(download_url);
        download_url_container.append(add_download_URL_button);

        download_urls.append(download_url_container);

        var download_url_count = 1;
        function addDownloadURL(previous_download_url) {
            var new_download_url_container = $("<div/>").addClass("download-url-container");
            var new_download_url = $("<input/>")
                .attr("class","download-url")
                .attr("type","text")
                .attr("id","download-url-" + download_url_count);

            if (previous_download_url === undefined) {
                previous_download_url = $(".download-url-container").last();
            }

            //detach from the previously last url input
            //so we can put it back on the new one
            add_download_URL_button.detach(); 

            var delete_download_url = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-download-url-button")
                .attr("type","button")
                .attr("aria-label","Remove citation")
                .click(function() {
                    $(this).parent().remove();
                });

            delete_download_url.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previous_download_url.append(delete_download_url);
            download_urls.append(new_download_url_container.append(new_download_url).append(add_download_URL_button));
            download_url_count++;
            return [new_download_url,new_download_url_container];
        }

        var previous_download_url;
        failed_downloads.forEach(function(item,index) {
            if(index === 0) {
                download_url.val(item);
                previous_download_url = download_url_container;
            } else {
                var additional_download_url = addDownloadURL(previous_download_url);
                additional_download_url[0].val(item);
                previous_download_url = additional_download_url[1];
            }
        });

        var config_username = "";
        var dspace_url = "";
        var login = $("<table/>").attr("id","login-fields-upload-data");
        var login_labels = $("<tr/>");
        var login_fields = $("<tr/>");

        var username_label = $("<label/>")
            .attr("for","username")
            .addClass("required")
            .text("Username: ");
        var username_field = $("<input/>")
            .attr("id","username")
            .attr("required","required");

        var password_label = $("<label/>")
            .attr("for","password")
            .addClass("required")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password")
            .attr("required","required")
            .attr("type","password");

        login_labels.append($("<td/>").append(username_label))
                    .append($("<td/>").append(password_label));

        login_fields.append($("<td/>").append(username_field))
                    .append($("<td/>").append(password_field));

        login.append(login_labels).append(login_fields);

        custom_contents.get_config().then(function(response){
            config_username = response.username;
            dspace_url = response.dspace_url;
            username_field.val(config_username);
        }).catch(function(reason){
            var error = $("<div/>")
                .addClass("config-error")
                .css("color","red");
            error.text(reason.message);
            login.after(error);
        });

        var validate_url = function(url) {
            var doi_regex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*)\/edata\/[0-9]+/;
            var purl_regex = /^http[s]?:\/\/purl\.org\/net\/edata[2]?\/handle\/edata\/[0-9]+$/;
            var url_regex = new RegExp(dspace_url + "[/]?handle\/edata\/[0-9]+");
            if(url.search(doi_regex) !== -1) {
                //doi match
                return true;
            } else if(url.search(purl_regex) !== -1) {
                //purl match
                return true;
            } else if(url.search(url_regex) !== -1) {
                return true;
            } else {
                return false;
            }
        };

        var form_body = $("<div/>")
            .append(
                $("<form/>").attr("id","download_data_form").append(
                        $("<label/>")
                        .attr("for","download_data_form")
                        .text("Give the URLs or DOIs to the data you would like to download."))
                        .append(download_urls)
                        .append(login)
            );
        
        var modal = dialog.modal({
            title: "Download data from eData",
            body: form_body,
            buttons: {
                Cancel: {},
                Download: { 
                    class : "btn-primary",
                    click: function() {
                        $(".download-form-error").remove();
                        var urls = [];
                        var at_least_one_url = false;
                        $(".download-url").each(function(index,item) {
                            //trim to remove leading & trailing whitespace
                            var curr_url = $(item).val().trim();
                            if(validate_url(curr_url)) {
                                urls.push(curr_url);
                                at_least_one_url = true;
                            } else if (curr_url !== "") {
                                //ignore blank inputs
                                var error = $("<div/>")
                                    .addClass("download-form-error")
                                    .css("color","red")
                                    .text("URL or DOI is not valid for eData");

                                $(item).before(error);
                            }
                        });
                        if(!at_least_one_url) {
                            var error = $("<div/>")
                                .addClass("download-form-error")
                                .css("color","red")
                                .text("Please enter at least one url");

                            $("label[for=\"download_data_form\"]").before(error);
                        }

                        if($(".download-form-error").length === 0) {
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();

                            var login_details = {
                                username: username_field_val,
                                password: password_field_val
                            };

                            var login_request = custom_contents.ldap_auth(login_details);

                            login_request.then(function() { //success function
                                custom_contents.download_data({
                                    URLs: urls,
                                    username: $("#username").val(),
                                    password: $("#password").val(),
                                    notebookpath: Jupyter.notebook.notebook_path
                                }).then(function(response) {
                                    var downloaded_items = Jupyter.notebook.metadata.downloaded_items || {};
                                    Object.keys(response).forEach(function(key) {
                                        var result = response[key];
                                        if(result.error) {
                                            custom_utils.create_alert(
                                                "alert-danger download-failure-alert",
                                                result.message + " while downloading " +
                                                result.name + " (<a href=\"" + key + 
                                                "\" class=\"alert-link\">"+ key + 
                                                "</a>)").attr("id",key);
                                        } else {
                                            custom_utils.create_alert(
                                                "alert-success download-success-alert",
                                                result.message + " " + result.name +
                                                " (<a href=\"" + key +  
                                                "\"class=\"alert-link\">" + key +
                                                "</a>) downloaded from eData.");
                                            downloaded_items[result.name] = result.paths;
                                        }
                                    });
                                    Jupyter.notebook.metadata.downloaded_items = downloaded_items;
                                    Jupyter.notebook.save_notebook();
                                    var failed_urls = [];
                                    $(".download-failure-alert").each(function() {
                                        failed_urls.push($(this).attr("id"));
                                    });
                                    if (failed_urls.length) {
                                        custom_utils.create_alert(
                                            "alert-info download-redownload-alert",
                                            "<a href=\"#\" class=\"alert-link\"" + 
                                            "id=\"redownload-link\">" + "Click here to " +
                                            "attempt to redownload the failed urls </a>");
                                        $("#redownload-link").click(function() {
                                            download_data(failed_urls);
                                        });
                                    }

                                    if(username_field_val !== config_username) {
                                        var config = {username: username_field_val};
                                        custom_contents.update_config(config).catch(
                                            function(reason){
                                                custom_utils.create_alert(
                                                    "alert-danger",
                                                    "Error! " + reason.message + 
                                                    "when trying to save username " +
                                                    "to config. If it " +
                                                    "continues to fail please " + 
                                                    "contact the developers.");
                                            }
                                        );
                                    }
                                });
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //fail function
                                var error = $("<div/>")
                                    .addClass("login-error")
                                    .css("color","red");

                                error.text(reason.message);
                                login.after(error);
                            });
                        }
                        return false;
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        //stuff to do when modal is open and fully visible
        modal.on("shown.bs.modal", function () {
            //add id for ease of usage
            $(".modal-footer > button.btn-primary").attr("id","download");
            $(".download-success-alert").alert("close");
            $(".download-failure-alert").alert("close");
            $(".download-redownload-alert").alert("close");
        });
    };

    var redownload_data = function() {
        
        var overwrite = $("<input/>")
            .attr("type","radio")
            .attr("id","filename-collision-behaviour-overwrite")
            .attr("name","filename-collision-behaviour")
            .attr("value","overwrite");

        var overwrite_label = $("<label/>")
            .attr("for","filename-collision-behaviour-overwrite")
            .append(overwrite)
            .append($("<span/>").text("Overwrite the file in your directory " +
                                      "with the one being downloaded from eData"));

        var rename = $("<input/>")
            .attr("type","radio")
            .attr("id","filename-collision-behaviour-rename")
            .attr("name","filename-collision-behaviour")
            .attr("value","rename");

        var rename_label = $("<label/>")
            .attr("for","filename-collision-behaviour-rename")
            .append(rename)
            .append($("<span/>").text("Rename the file being downloaded. Warning: " + 
                                      "this means the notebook may not run as " +
                                      "it will not be referencing the file that " +
                                      "has been downloaded and instead will " +
                                      "reference your local file"));


        var config_username = "";
        var login = $("<table/>").attr("id","login-fields-upload-data");
        var login_labels = $("<tr/>");
        var login_fields = $("<tr/>");

        var username_label = $("<label/>")
            .attr("for","username")
            .addClass("required")
            .text("Username: ");
        var username_field = $("<input/>")
            .attr("id","username")
            .attr("required","required");

        var password_label = $("<label/>")
            .attr("for","password")
            .addClass("required")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password")
            .attr("required","required")
            .attr("type","password");

        login_labels.append($("<td/>").append(username_label))
                    .append($("<td/>").append(password_label));

        login_fields.append($("<td/>").append(username_field))
                    .append($("<td/>").append(password_field));

        login.append(login_labels).append(login_fields);

        custom_contents.get_config().then(function(response){
            config_username = response.username;
            username_field.val(config_username);
        }).catch(function(reason){
            var error = $("<div/>")
                .addClass("config-error")
                .css("color","red");
            error.text(reason.message);
            login.after(error);
        });

        var form_body = $("<div/>")
            .append(
                $("<form/>").attr("id","download_data_form").append(
                        $("<label/>")
                        .attr("for","download_data_form")
                        .text("Retrieve the data used to make this notebook from eData. " +
                              "This will download the files into the same directory as this notebook. " +
                              "Please select what you want to do if there is a file in this directory " +
                              "that has the same filename as one that is attempting to be downloaded: "))
                        .append(overwrite_label)
                        .append(rename_label)
                        .append(login)
            );
        
        var modal = dialog.modal({
            title: "Download data from eData",
            body: form_body,
            buttons: {
                Cancel: {},
                Download: { 
                    class : "btn-primary",
                    click: function() {
                        $(".download-form-error").remove();
                        if(!("databundle_url" in Jupyter.notebook.metadata)) {
                            var error = $("<div/>")
                                .addClass("download-form-error")
                                .css("color","red")
                                .text("No databundle url has been associated with this notebook");

                            $("label[for=\"download_data_form\"]").before(error);
                        }

                        if($(".download-form-error").length === 0) {
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();

                            var login_details = {
                                username: username_field_val,
                                password: password_field_val
                            };

                            var login_request = custom_contents.ldap_auth(login_details);

                            login_request.then(function() { //success function
                                custom_contents.redownload_data({
                                    URL: Jupyter.notebook.metadata.databundle_url,
                                    username: $("#username").val(),
                                    password: $("#password").val(),
                                    notebookpath: Jupyter.notebook.notebook_path,
                                    collision_mode: $("input[name=\"filename-collision-behaviour\"]:checked").val(),
                                }).then(function(response) {
                                    var db_url = Jupyter.notebook.metadata.databundle_url;
                                    if(response.error) {
                                        custom_utils.create_alert(
                                            "alert-danger download-failure-alert",
                                            response.message + " while downloading " +
                                            response.name + " (<a href=\"" + db_url + 
                                            "\" class=\"alert-link\">"+ db_url + 
                                            "</a>)").attr("id",db_url);
                                    } else {
                                        custom_utils.create_alert(
                                            "alert-success download-success-alert",
                                            response.message + " " + response.name +
                                            " (<a href=\"" + db_url +  
                                            "\"class=\"alert-link\">" + db_url +
                                            "</a>) downloaded from eData.");
                                    }

                                    if(username_field_val !== config_username) {
                                        var config = {username: username_field_val};
                                        custom_contents.update_config(config).catch(
                                            function(reason){
                                                custom_utils.create_alert(
                                                    "alert-danger",
                                                    "Error! " + reason.message + 
                                                    "when trying to save username " +
                                                    "to config. If it " +
                                                    "continues to fail please " + 
                                                    "contact the developers.");
                                            }
                                        );
                                    }
                                });
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //fail function
                                var error = $("<div/>")
                                    .addClass("login-error")
                                    .css("color","red");

                                error.text(reason.message);
                                login.after(error);
                            });
                        }
                        return false;
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        //stuff to do when modal is open and fully visible
        modal.on("shown.bs.modal", function () {
            //add id for ease of usage
            $(".modal-footer > button.btn-primary").attr("id","download");
        });
    };

    /*  
     *  The below adds an action to the notebook and assigns the add_metadata
     *  function to the Add metadata function, and handles exporting the
     *  functions we use in other modules/files.
     */

    var download_action = {
        help: "Download data from urls/dois",
        help_index: "a",
        icon: "fa-download",
        handler : download_data,
    };

    var download_prefix = "linker_extension";
    var download_action_name = "download-data";

    var redownload_action = {
        help: "Redownload associated bundle from eData",
        help_index: "a",
        icon: "fa-download",
        handler : redownload_data,
    };

    var redownload_prefix = "linker_extension";
    var redownload_action_name = "redownload-data";

    var load = function () {
        Jupyter.actions.register(download_action,download_action_name,download_prefix);
        Jupyter.actions.register(redownload_action,redownload_action_name,redownload_prefix);
        $("#download_data").click(function () {
            download_data([]);
        });

        $("#redownload_data").click(function () {
            redownload_data();
        });

    };

    module.exports = {
        load: load,
    };
});