define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "./view_data_dialog",
        "./add_metadata",
        "./select_data_notebook",
        "./upload_notebook",
        "./upload_data",
        "./modify_notebook_html"
],function(Jupyter,
           utils,
           dialog,
           custom_contents,
           view_data,
           add_metadata,
           select_data,
           upload_notebook,
           upload_data) {

    //Publish. Gives users a last chance to add metadata or associate files
    //before uploading notebook and data to dspace.

    var Promise = require("es6-promise").Promise;

    var publish_notebook_and_bundle = function() {
        var add_metadata_form_fields = add_metadata.create_fields();
        add_metadata_form_fields.form1.addClass("hide-me");
        add_metadata_form_fields.form2.addClass("hide-me");

        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish_form");

        instructions.text("Check the files currently associated with this " + 
                          "notebook and add additional metadata for the zip " + 
                          "file contianing all the following files. Click the " +
                          "\"Select Data\" button to navigate away from this " + 
                          "page to select additional data to associate with " +
                          "this notebook");

        var upload_data_info = upload_data.upload_data_form(); 

        var upload_data_container = $("<div/>")
            .attr("id","upload-data-container")
            .append(upload_data_info.dialog_body);

        var form_body = $("<div/>").attr("title", "Publish notebook")
        .append(
            $("<form id=\"publish_form\"/>")
                    .append(instructions)
                    .append(upload_data_container)
                    .append(add_metadata_form_fields.form1)
                    .append(add_metadata_form_fields.form2)
        );

        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");
        
        var login = $("<table/>").attr("id","login-fields-upload-data");
        var login_labels = $("<tr/>");
        var login_fields = $("<tr/>");

        var username_label = $("<label/>")
            .attr("for","username")
            .text("Username: ");
        var username_field = $("<input/>").attr("id","username");

        var password_label = $("<label/>")
            .attr("for","password")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password")
            .attr("type","password");

        login_labels.append($("<td/>").append(username_label))
                    .append($("<td/>").append(password_label));

        login_fields.append($("<td/>").append(username_field))
                    .append($("<td/>").append(password_field));

        login.append(login_labels).append(login_fields);

        final_page.append(login);

        form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Notebook and Data",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if($("#upload-data-container").hasClass("hide-me") &&
                           !$("#fields1").hasClass("hide-me"))
                        {
                            $("#fields1").addClass("hide-me");
                            $("#upload-data-container").removeClass("hide-me");
                            $("#previous").prop("disabled",true);
                            instructions.text("Check the files currently " +
                                              "associated with this notebook. " +
                                              "Click the \"Select Data\" button " +
                                              "to navigate away from this page " +
                                              "to select additional data to " +
                                              "associate with this notebook");
                        }
                        else if($("#fields1").hasClass("hide-me") &&
                                !$("#fields2").hasClass("hide-me"))
                        {
                            $("#fields2").addClass("hide-me");
                            $("#fields1").removeClass("hide-me");
                        }
                        else if($("#fields2").hasClass("hide-me") &&
                                !$("#final-page").hasClass("hide-me"))
                        {
                            $("#final-page").addClass("hide-me");
                            $("#fields2").removeClass("hide-me");

                            //we want button text to be next
                            //on any page but the last one
                            $("#next").text("Next");
                            instructions.text("Check and edit the metadata for " +
                                              "the notebook before uploading to eData.");
                        }
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#upload-data-container").hasClass("hide-me")) {
                            upload_data.validate_upload_data();
                            if($(".data-form-error").length === 0) {
                                /*var bundle_metadata = {};
                                bundle_metadata.abstract = $("#data_abstract").val();
                                var referencedBy_URLs = [];
                                $(".data_referencedBy").each(function(i,e) {
                                    referencedBy_URLs.push($(e).val());
                                });
                                bundle_metadata.referencedBy = referencedBy_URLs;
                                //TODO: do we need to save this metadata or not? ask
                                Jupyter.notebook.metadata.bundle_metadata = bundle_metadata;*/

                                $("#upload-data-container").addClass("hide-me");
                                $("#fields1").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                                instructions.text("Check and edit the metadata for " +
                                                  "the notebook before uploading to eData.");
                            }
                        } else if (!$("#fields1").hasClass("hide-me")) {
                            add_metadata.validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields1").addClass("hide-me");
                                $("#fields2").removeClass("hide-me");
                            }
                        }  else if (!$("#fields2").hasClass("hide-me")) {
                            add_metadata.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields2").addClass("hide-me");
                                $("#final-page").removeClass("hide-me");

                                //we want next to be publish on the last page
                                $("#next").text("Publish");
                                instructions.text("Confirm that you would like " + 
                                                  "to upload the notebook and " + 
                                                  "data bundle.");
                            }
                        }
                        else if (!$("#final-page").hasClass("hide-me")) {
                            //do login validation and publishing here!
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();
                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            var licence_file = $("#licence-file").prop("files")[0];

                            var licence_file_contents = "";
                            var promise;
                            if ($("#licence-file").val()) {
                                promise = new Promise(function(resolve,reject) {
                                    var reader = new FileReader();

                                    reader.onload = function(e) {
                                        licence_file_contents = e.target.result;
                                        resolve(e.target.result);
                                    };

                                    reader.onerror = function() {
                                        //TODO: handle error
                                        reject();
                                    };

                                    reader.readAsDataURL(licence_file);
                                });
                            } else {
                                promise = Promise.resolve();
                            }

                            request.then(
                                function() {
                                    promise.then(
                                        function() { //success function
                                            upload_data.upload_data(
                                                username_field_val,
                                                password_field_val,
                                                upload_data_info.file_names,
                                                upload_data_info.file_paths,
                                                upload_data_info.file_types
                                            );

                                            upload_notebook.upload_notebook(
                                                username_field_val,
                                                password_field_val,
                                                $("#licence-file").val(),
                                                licence_file_contents
                                            );

                                            $(".modal").modal("hide");
                                        },
                                        function() { //upload failed
                                            var error = $("<div/>")
                                                .addClass("upload-error")
                                                .css("color","red")
                                                .text("File upload failed - please try again.");
                                            instructions.after(error);
                                        }
                                    );
                                },
                                function(reason) { //login failed
                                    var error = $("<div/>")
                                        .addClass("login-error")
                                        .css("color","red");

                                    if (reason.xhr.status === 401) { //unauthorised
                                        //you dun goofed on ur login
                                        error.text("Login details not receognised.");
                                        instructions.after(error);
                                    } else if (reason.xhr.status === 400) { //invalid
                                        //you dun goofed on ur login
                                        error.text("Login details not valid.");
                                        instructions.after(error);
                                    } else {
                                        //shouldn't really get here?
                                        error.text("Login failed - please try again.");
                                        instructions.after(error);
                                    }
                                }
                            );
                        }
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss")
                                                    .attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss")
                                                    .attr("id","next");
        });

    };

    var publish_notebook = function() {
        var add_metadata_form_fields = add_metadata.create_fields();
        add_metadata_form_fields.form2.addClass("hide-me");

        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish_form");

        instructions.text("Check the files currently associated with this " + 
                          "notebook and add additional metadata for the zip " + 
                          "file contianing all the following files. Click the " +
                          "\"Select Data\" button to navigate away from this " + 
                          "page to select additional data to associate with " +
                          "this notebook");

        var form_body = $("<div/>").attr("title", "Publish notebook")
        .append(
            $("<form id=\"publish_form\"/>")
                    .append(instructions)
                    .append(add_metadata_form_fields.form1)
                    .append(add_metadata_form_fields.form2)
        );


        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");

        var login = $("<table/>").attr("id","login-fields-upload-data");
        var login_labels = $("<tr/>");
        var login_fields = $("<tr/>");

        var username_label = $("<label/>")
            .attr("for","username")
            .text("Username: ");
        var username_field = $("<input/>").attr("id","username");

        var password_label = $("<label/>")
            .attr("for","password")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password")
            .attr("type","password");

        login_labels.append($("<td/>").append(username_label))
                    .append($("<td/>").append(password_label));

        login_fields.append($("<td/>").append(username_field))
                    .append($("<td/>").append(password_field));

        login.append(login_labels).append(login_fields);

        final_page.append(login);

        form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Notebook",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if($("#fields1").hasClass("hide-me") &&
                           !$("#fields2").hasClass("hide-me"))
                        {
                            $("#fields2").addClass("hide-me");
                            $("#fields1").removeClass("hide-me");
                            $("#previous").prop("disabled",true);
                        }
                        else if($("#fields2").hasClass("hide-me") &&
                                !$("#final-page").hasClass("hide-me"))
                        {
                            $("#final-page").addClass("hide-me");
                            $("#fields2").removeClass("hide-me");

                            //we want button text to be next
                            //on any page but the last one
                            $("#next").text("Next");
                            instructions.text("Check and edit the metadata for " +
                                              "the notebook before uploading to eData.");
                        }
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if (!$("#fields1").hasClass("hide-me")) {
                            add_metadata.validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields1").addClass("hide-me");
                                $("#fields2").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                            }
                        }  else if (!$("#fields2").hasClass("hide-me")) {
                            add_metadata.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields2").addClass("hide-me");
                                $("#final-page").removeClass("hide-me");
                                $("#next").text("Publish"); //we want next to be save on the last page
                                instructions.text("Confirm that you would like " + 
                                                  "to upload the notebook.");
                            }
                        }
                        else if (!$("#final-page").hasClass("hide-me")) {
                            //do login validation and publishing here!
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();
                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            var licence_file = $("#licence-file").prop("files")[0];

                            var licence_file_contents = "";
                            var promise;
                            if ($("#licence-file").val()) {
                                promise = new Promise(function(resolve,reject) {
                                    var reader = new FileReader();

                                    reader.onload = function(e) {
                                        licence_file_contents = e.target.result;
                                        resolve(e.target.result);
                                    };

                                    reader.onerror = function() {
                                        //TODO: handle error
                                        reject();
                                    };

                                    reader.readAsDataURL(licence_file);
                                });
                            } else {
                                promise = Promise.resolve();
                            }

                            request.then(
                                function() {
                                    promise.then(
                                        function() { //success function
                                            upload_notebook.upload_notebook(
                                                username_field_val,
                                                password_field_val,
                                                $("#licence-file").val(),
                                                licence_file_contents
                                            );

                                            $(".modal").modal("hide");
                                        },
                                        function() { //upload failed
                                            var error = $("<div/>")
                                                .addClass("upload-error")
                                                .css("color","red")
                                                .text("File upload failed - please try again.");
                                            instructions.after(error);
                                        }
                                    );
                                },
                                function(reason) { //login failed
                                    var error = $("<div/>")
                                        .addClass("login-error")
                                        .css("color","red");

                                    if (reason.xhr.status === 401) { //unauthorised
                                        //you dun goofed on ur login
                                        error.text("Login details not receognised.");
                                        instructions.after(error);
                                    } else if (reason.xhr.status === 400) { //invalid
                                        //you dun goofed on ur login
                                        error.text("Login details not valid.");
                                        instructions.after(error);
                                    } else {
                                        //shouldn't really get here?
                                        error.text("Login failed - please try again.");
                                        instructions.after(error);
                                    }
                                }
                            );
                        }
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss")
                                                    .attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss")
                                                    .attr("id","next");
        });

    };

    var publish_bundle = function() {
        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish_form");

        instructions.text("Check the files currently associated with this " + 
                          "notebook and add additional metadata for the zip " + 
                          "file contianing all the following files. Click the " +
                          "\"Select Data\" button to navigate away from this " + 
                          "page to select additional data to associate with " +
                          "this notebook");

        var upload_data_info = upload_data.upload_data_form(); 

        var upload_data_container = $("<div/>")
            .attr("id","upload-data-container")
            .append(upload_data_info.dialog_body);

        var form_body = $("<div/>").attr("title", "Publish data")
        .append(
            $("<form id=\"publish_form\"/>")
                    .append(instructions)
                    .append(upload_data_container)
        );

        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");
        
        var login = $("<table/>").attr("id","login-fields-upload-data");
        var login_labels = $("<tr/>");
        var login_fields = $("<tr/>");

        var username_label = $("<label/>")
            .attr("for","username")
            .text("Username: ");
        var username_field = $("<input/>").attr("id","username");

        var password_label = $("<label/>")
            .attr("for","password")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password")
            .attr("type","password");

        login_labels.append($("<td/>").append(username_label))
                    .append($("<td/>").append(password_label));

        login_fields.append($("<td/>").append(username_field))
                    .append($("<td/>").append(password_field));

        login.append(login_labels).append(login_fields);

        final_page.append(login);
        
        form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Data",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if($("#upload-data-container").hasClass("hide-me") &&
                                !($("#final-page").hasClass("hide-me")))
                        {
                            $("#final-page").addClass("hide-me");
                            $("#upload-data-container").removeClass("hide-me");
                            $("#previous").prop("disabled",true);

                            //we want button text to be next
                            //on any page but the last one
                            $("#next").text("Next");
                        }
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#upload-data-container").hasClass("hide-me")) {
                            upload_data.validate_upload_data();
                            if($(".data-form-error").length === 0) {
                                /*var bundle_metadata = {};
                                bundle_metadata.abstract = $("#data_abstract").val();
                                var referencedBy_URLs = [];
                                $(".data_referencedBy").each(function(i,e) {
                                    referencedBy_URLs.push($(e).val());
                                });
                                bundle_metadata.referencedBy = referencedBy_URLs;
                                //TODO: do we need to save this metadata or not? ask

                                Jupyter.notebook.metadata.bundle_metadata = bundle_metadata;*/

                                $("#upload-data-container").addClass("hide-me");
                                $("#final-page").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                                instructions.text("Confirm that you would like " + 
                                                  "to upload the data bundle.");

                                //we want next to be publish on the last page
                                $("#next").text("Publish");
                            }
                        }

                        else if (!$("#final-page").hasClass("hide-me")) {
                            //do login validation and publishing here!
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();
                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            request.then(
                                function() { //success function
                                    upload_data.upload_data(
                                        username_field_val,
                                        password_field_val,
                                        upload_data_info.file_names,
                                        upload_data_info.file_paths,
                                        upload_data_info.file_types
                                    );

                                    $(".modal").modal("hide");
                                },
                                function(reason) { //fail function
                                    var error = $("<div/>")
                                        .addClass("login-error")
                                        .css("color","red");

                                    if (reason.xhr.status === 401) { //unauthorised
                                        //you dun goofed on ur login
                                        error.text("Login details not receognised.");
                                        instructions.after(error);
                                    } else if (reason.xhr.status === 400) { //unauthorised
                                        //you dun goofed on ur login
                                        error.text("Login details not valid.");
                                        instructions.after(error);
                                    } else {
                                        //shouldn't really get here?
                                        error.text("Login failed - please try again.");
                                        instructions.after(error);
                                    }
                                }
                            );
                        }
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss")
                                                    .attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss")
                                                    .attr("id","next");
        });

    };

    var publish_notebook_action = {
        help: "Publish notebook",
        help_index: "a",
        icon: "fa-upload",
        handler : publish_notebook,
    };

    var publish_notebook_prefix = "linker_extension";
    var publish_notebook_action_name = "publish-notebook";
    

    var publish_bundle_action = {
        help: "Publish data bundle",
        help_index: "a",
        icon: "fa-upload",
        handler : publish_bundle,
    };

    var publish_bundle_prefix = "linker_extension";
    var publish_bundle_action_name = "publish-bundle";

    var publish_both_action = {
        help: "Publish notebook and data bundle",
        help_index: "a",
        icon: "fa-upload",
        handler : publish_notebook_and_bundle,
    };

    var publish_both_prefix = "linker_extension";
    var publish_both_action_name = "publish-notebook-and-data-bundle";

    var load = function () {
        Jupyter.actions.register(
            publish_notebook_action,
            publish_notebook_action_name,
            publish_notebook_prefix
        );
        $("#publish_notebook").click(function () {
            publish_notebook();
        });
        Jupyter.actions.register(
            publish_bundle_action,
            publish_bundle_action_name,
            publish_bundle_prefix
        );
        $("#publish_bundle").click(function () {
            publish_bundle();
        });
        Jupyter.actions.register(
            publish_both_action,
            publish_both_action_name,
            publish_both_prefix
        );
        $("#publish_notebook_and_bundle").click(function () {
            publish_notebook_and_bundle();
        });
    };

    module.exports = {
        load: load,
    };
});