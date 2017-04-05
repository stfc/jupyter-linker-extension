define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "../custom_utils",
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
           custom_utils,
           view_data,
           add_metadata,
           select_data,
           upload_notebook,
           upload_data) {

    //Publish. Gives users a last chance to add metadata or associate files
    //before uploading notebook and data to dspace.

    /*  
     *  A dialog that allows the user to publish both the data and the notebook
     *  to DSpace. Uses the forms that are created in add_metadata and
     *  upload_data. Not attached to a button right now - but left the method
     *  in in case we use it later. Really just a convinience function
     */ 
    var publish_notebook_and_bundle = function() {
        var add_metadata_form_fields = add_metadata.create_fields();
        add_metadata_form_fields.form1.addClass("hide-me");
        add_metadata_form_fields.form2.addClass("hide-me");

        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish-form");

        instructions.text("Select the files that you would like to be uploaded " +
                          "to eData as a data bundle for this notebook");

        var upload_data_pages = upload_data.upload_data_form(); 

        var form_body = $("<form/>").attr("id","publish-form")
                            .append(instructions)
                            .append(upload_data_pages.files_page)
                            .append(upload_data_pages.metadata_page)
                            .append(add_metadata_form_fields.form1)
                            .append(add_metadata_form_fields.form2);

        //We need a last page to prompt the user for their username/password
        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");
        
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

        final_page.append(login);

        form_body.append(final_page);

        //holders for the fields generated by the get_values_from_fields() promises
        var metadata = {};
        var data_metadata = {};

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

        //create the actual dialog
        var modal = dialog.modal({
            title: "Publish Notebook and Data",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if($("#files-page").hasClass("hide-me") &&
                                !($("#metadata-page").hasClass("hide-me")))
                        {
                            $("#metadata-page").addClass("hide-me");
                            instructions.text("Select the files that you would like to be uploaded " +
                                              "to eData as a data bundle for this notebook");
                            $("#files-page").removeClass("hide-me");
                            $("#previous").prop("disabled",true);
                        }
                        if($("#metadata-page").hasClass("hide-me") &&
                           !$("#fields1").hasClass("hide-me"))
                        {
                            $("#fields1").addClass("hide-me");
                            instructions.text(
                                "Add metadata to the file bundle.");
                            $("#metadata-page").removeClass("hide-me");
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
                        return false;
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#files-page").hasClass("hide-me")) {
                            upload_data.validate_files();
                            if($(".data-form-error").length === 0) {
                                $("#files-page").addClass("hide-me");
                                $("#metadata-page").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                                instructions.text(
                                    "Add metadata to the file bundle.");
                            }
                        }
                        else if(!$("#metadata-page").hasClass("hide-me")) {
                            upload_data.validate_metadata();
                            if($(".data-form-error").length === 0) {
                                var data_promise = upload_data.get_values_from_fields();
                                data_promise.then(function(results) { //success function
                                    data_metadata = results;

                                    $("#metadata-page").addClass("hide-me");
                                    $("#fields1").removeClass("hide-me");
                                    $("#previous").prop("disabled",false);
                                    instructions.text(
                                        "Check and edit the metadata for " +
                                        "the notebook before uploading to eData.");
                                }).catch(function() {
                                    var error = $("<div/>")
                                        .addClass("upload-error")
                                        .css("color","red")
                                        .text("File upload failed - please try again.");
                                    instructions.after(error);
                                });
                                /*var bundle_metadata = {};
                                bundle_metadata.abstract = $("#data_abstract").val();
                                var referencedBy_URLs = [];
                                $(".data_referencedBy").each(function(i,e) {
                                    referencedBy_URLs.push($(e).val());
                                });
                                bundle_metadata.referencedBy = referencedBy_URLs;
                                //TODO: do we need to save this metadata or not? ask
                                Jupyter.notebook.metadata.bundle_metadata = bundle_metadata;*/

                            }
                        } else if (!$("#fields1").hasClass("hide-me")) {
                            add_metadata.validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields1").addClass("hide-me");
                                $("#fields2").removeClass("hide-me");
                            }
                        } else if (!$("#fields2").hasClass("hide-me")) {
                            add_metadata.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                add_metadata.get_values_from_fields().then(function(result) {
                                    Jupyter.notebook.metadata.reportmetadata = result;
                                    Jupyter.notebook.save_notebook();
                                    metadata = result;

                                    $("#fields2").addClass("hide-me");
                                    $("#final-page").removeClass("hide-me");

                                    //we want next to be publish on the last page
                                    $("#next").text("Publish");
                                    instructions.text("Confirm that you would like " + 
                                                      "to upload the notebook and " + 
                                                      "data bundle.");
                                }).catch(function(){
                                    var error = $("<div/>")
                                        .addClass("upload-error")
                                        .css("color","red")
                                        .text("File upload failed - please try again.");
                                    instructions.after(error);
                                });

                            }
                        } else if (!$("#final-page").hasClass("hide-me")) {
                            //do login validation and publishing here!
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();
                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            //wait for ldap request to be done
                            request.then(function() {
                                metadata.username = username_field_val;
                                metadata.password = password_field_val;
                                metadata.notebookpath = Jupyter.notebook.notebook_path;

                                //copy the properties in the nb metadata that
                                // are missing from the data metadata
                                Object.keys(metadata).forEach(function(key) {
                                    if(!data_metadata.hasOwnProperty(key)) {
                                        data_metadata[key] = metadata[key];
                                    }
                                });

                                upload_data.upload_data(data_metadata);
                                upload_notebook.upload_notebook(metadata);

                                if(username_field_val !== config_username) {
                                    var config = JSON.stringify({username: username_field_val});
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
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //login failed
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
        //stuff to do on modal load
        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).attr("id","next");
        });

    };

    /*  
     *  
     */ 
    var publish_notebook_warning = function() {
        var warning = $("<p/>");
        var confirm = $("<p/>");
        confirm.text("Please confirm that you'd like to go ahead and upload " +
                         "the notebook anyway.");
        if("databundle_url" in Jupyter.notebook.metadata) {
            publish_notebook();
        } else if (!("databundle_url" in Jupyter.notebook.metadata) && 
                   "databundle" in Jupyter.notebook.metadata)
        {
            var not_uploaded_body = $("<div/>");
            warning.append("Warning! You have data that you have associated with " +
                         "this notebook that you have not published to eData " +
                         "yet. We recommend uploading your data first so that " +
                         "the notebook can reference the data record in eData.");
            not_uploaded_body.append(warning).append("<br/>").append(confirm);
            dialog.modal({
                title: "Confirm uploading notebook without data",
                body: not_uploaded_body,
                buttons: {
                    Cancel: {},
                    Confirm: { 
                        class : "btn-primary",
                        click: function() {
                            publish_notebook();
                        },
                    }
                },
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.notebook.keyboard_manager,
            });
        } else {
            var no_data_body = $("<div/>");
            warning.text("Warning! You have not associated any data with this " +
                         "notebook.");
            no_data_body.append(warning).append("<br/>").append(confirm);
            dialog.modal({
                title: "Confirm uploading notebook without data",
                body: no_data_body,
                buttons: {
                    Cancel: {},
                    Confirm: { 
                        class : "btn-primary",
                        click: function() {
                            publish_notebook();
                        },
                    }
                },
                notebook: Jupyter.notebook,
                keyboard_manager: Jupyter.notebook.keyboard_manager,
            });
        }
    };

    /*  
     *  Only publish the notebook.
     */ 
    var publish_notebook = function() {
        var add_metadata_form_fields = add_metadata.create_fields();
        add_metadata_form_fields.form2.addClass("hide-me");

        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish-form");

        instructions.text("Check the files currently associated with this " + 
                          "notebook and add additional metadata for the zip " + 
                          "file contianing all the following files. Click the " +
                          "\"Select Data\" button to navigate away from this " + 
                          "page to select additional data to associate with " +
                          "this notebook");

        var form_body = $("<form/>").attr("id","publish-form")
                    .append(instructions)
                    .append(add_metadata_form_fields.form1)
                    .append(add_metadata_form_fields.form2);


        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");

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

        final_page.append(login);

        form_body.append(final_page);

        //holder for get_values_from_fields return value
        var metadata = {};

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
                        return false;
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
                                add_metadata.get_values_from_fields().then(function(result) {
                                    Jupyter.notebook.metadata.reportmetadata = result;
                                    Jupyter.notebook.save_notebook();
                                    metadata = result;

                                    $("#fields2").addClass("hide-me");
                                    $("#final-page").removeClass("hide-me");

                                    //we want next to be publish on the last page
                                    $("#next").text("Publish");
                                    instructions.text("Confirm that you would like " + 
                                                      "to upload the notebook.");
                                }).catch(function(){
                                    var error = $("<div/>")
                                        .addClass("upload-error")
                                        .css("color","red")
                                        .text("File upload failed - please try again.");
                                    instructions.after(error);
                                });
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

                            //wait for both ldap request and file upload to be done
                            request.then(function() {
                                metadata.username = username_field_val;
                                metadata.password = password_field_val;
                                metadata.notebookpath = Jupyter.notebook.notebook_path;
                                upload_notebook.upload_notebook(metadata);

                                if(username_field_val !== config_username) {
                                    var config = JSON.stringify({username: username_field_val});
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
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //login failed
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

        //stuff to do on modal load
        modal.on("shown.bs.modal", function () {
            //disable keyboard - need this because we may have triggered the
            //warning modal, which on close reenables the keyboard, so just re-disable it
            Jupyter.notebook.keyboard_manager.disable();
            $(".modal-footer > button.btn-sm").eq(1).attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).attr("id","next");
        });

    };

    /*  
     *  Only publish the data
     */ 
    var publish_bundle = function() {

        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish-form");

        instructions.text("Select the files that you would like to be uploaded " +
                          "to eData as a data bundle for this notebook");

        var upload_data_fields = upload_data.upload_data_form(); 

        var form_body = $("<form/>").attr("id","publish-form")
                        .append(instructions)
                        .append(upload_data_fields.files_page)
                        .append(upload_data_fields.metadata_page);

        var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");
        
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

        final_page.append(login);
        
        form_body.append(final_page);

        //holder for get_values_from_fields return value
        var data_metadata = {};

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

        var modal = dialog.modal({
            title: "Publish Data",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if($("#files-page").hasClass("hide-me") &&
                                !($("#metadata-page").hasClass("hide-me")))
                        {
                            $("#metadata-page").addClass("hide-me");
                            instructions.text("Select the files that you would like to be uploaded " +
                                              "to eData as a data bundle for this notebook");
                            $("#files-page").removeClass("hide-me");
                            $("#previous").prop("disabled",true);

                            //we want button text to be next
                            //on any page but the last one
                            $("#next").text("Next");
                        }
                        if($("#metadata-page").hasClass("hide-me") &&
                                !($("#final-page").hasClass("hide-me")))
                        {
                            $("#final-page").addClass("hide-me");
                            instructions.text(
                                "Add metadata to the file bundle.");
                            $("#metadata-page").removeClass("hide-me");

                        }
                        return false;
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#files-page").hasClass("hide-me")) {
                            upload_data.validate_files();
                            if($(".data-form-error").length === 0) {
                                $("#files-page").addClass("hide-me");
                                $("#metadata-page").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                                instructions.text(
                                    "Add metadata to the file bundle.");
                            }
                        }
                        else if(!$("#metadata-page").hasClass("hide-me")) {
                            upload_data.validate_metadata();
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

                                var data_promise = upload_data.get_values_from_fields();
                                data_promise.then(function(results) { //success function
                                    data_metadata = results;
                                    
                                    data_metadata.notebookpath = Jupyter.notebook.notebook_path;

                                    $("#metadata-page").addClass("hide-me");
                                    $("#final-page").removeClass("hide-me");
                                    $("#previous").prop("disabled",false);
                                    instructions.text("Confirm that you would like " + 
                                                      "to upload the notebook.");
                                    $("#next").text("Publish");
                                }).catch(function() {
                                    var error = $("<div/>")
                                        .addClass("upload-error")
                                        .css("color","red")
                                        .text("File upload failed - please try again.");
                                    instructions.after(error);
                                });
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


                            //wait for ldap request
                            request.then(function() { //success function
                                data_metadata.username = username_field_val;
                                data_metadata.password = password_field_val;
                                var metadata = add_metadata.get_values_from_metadata();

                                //copy the properties in the nb metadata that
                                // are missing from the data metadata
                                Object.keys(metadata).forEach(function(key) {
                                    if(!data_metadata.hasOwnProperty(key)) {
                                        data_metadata[key] = metadata[key];
                                    }
                                });

                                upload_data.upload_data(data_metadata);

                                if(username_field_val !== config_username) {
                                    var config = JSON.stringify({username: username_field_val});
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
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //login failed
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

        //stuff to do on modal load
        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).attr("id","next");
        });

    };

    //register all the actions and set up the buttons

    var publish_notebook_action = {
        help: "Publish notebook",
        help_index: "a",
        icon: "fa-upload",
        handler : publish_notebook_warning,
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
            publish_notebook_warning();
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
        });/*
        Jupyter.actions.register(
            publish_both_alternate_action,
            publish_both_alternate_action_name,
            publish_both_alternate_prefix
        );
        $("#publish_notebook_and_bundle_alternate").click(function () {
            publish_notebook_and_bundle_alternate();
        });*/
    };

    module.exports = {
        load: load,
    };
});