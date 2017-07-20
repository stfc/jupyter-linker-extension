define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "../custom_utils",
        "./metadata/add_metadata_input_fields",
        "./local_data",
],function(Jupyter,
           utils,
           dialog,
           custom_contents,
           custom_utils,
           add_metadata,
           local_data) { 
    var config_username = "";
    var md = Jupyter.notebook.metadata;
    
	var final_page = function() {
		var final_page = $("<div/>").attr("id","final-page");
        final_page.addClass("hide-me");
        
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
        
        return final_page;
	}
	
	function extract_id(response) {
		console.log("Attempting to extract ID");
        var id = "";
        var xml_str = response.split("\n");
        xml_str.forEach(function(item) {
            if (item.indexOf("<atom:id>") !== -1) { // -1 means it's not in the string
                var endtag = item.lastIndexOf("<");
                var without_endtag = item.slice(0,endtag);
                var starttag = without_endtag.indexOf(">");
                var without_starttag = without_endtag.slice(starttag + 1);
                id = without_starttag;
                console.log("Found id: " + id);
            }
        });
        
        return id;
	} 
	
    var upload_data = function(login_details) {
        if (!("reportmetadata" in md)) {
            custom_utils.create_alert("alert-danger",
                                      "Error! No report metadata - please " +
                                      " fill in the report metadata first.");
        } else {  
        	var data_to_upload = JSON.parse(JSON.stringify(md.reportmetadata));
        	data_to_upload.username = login_details.username;
            data_to_upload.password = login_details.password;
            data_to_upload.notebookpath = Jupyter.notebook.notebook_path;
        	custom_contents.upload_data(data_to_upload).then(
                function(response) {
                	console.log("Successfully uploaded data");
                    md.databundle_url = extract_id(response);
                    Jupyter.notebook.save_notebook();
                    custom_utils.create_alert("alert-success data-upload-success-alert",
                                              "Success! Item created in eData! " +
                                              "It is located here: <a href =\"" +
                                              md.databundle_url + "\" class=\"alert-link\">"
                                              + md.databundle_url + "</a>")
                                              .attr("item-id", md.databundle_url);
                },
                function(reason) {
                	console.log("Failed to upload data: " + reason.message);
                    custom_utils.create_alert("alert-danger",
                                              "Failed to upload data. Please try " +
                    		                  "again, or contact the support team.");
                }
            );
        }
    };
	
    var publish = function() {
        var instructions = $("<label/>")
            .attr("id","publish_instructions")
            .attr("for","publish-form");

        instructions.text("Confirm data to be published");

        var data_fields = local_data.data_form("publish");
        var metadata_fields = add_metadata.create_forms();
        metadata_fields.form1.addClass("hide-me");
        metadata_fields.form2.addClass("hide-me");

        var form_body = $("<form/>").attr("id","publish-form")
                        .append(instructions)
                        .append(data_fields)
                        .append(metadata_fields.form1)
                        .append(metadata_fields.form2)
                        .append(final_page());

        var modal = dialog.modal({
            title: "Publish Data",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        if (!($("#md_fields1").hasClass("hide-me"))) {
                            $("#md_fields1").addClass("hide-me");
                            instructions.text("Confirm data to be published");
                            local_data.init_data_form(md.reportmetadata.files, "publish");
                            $("#files-page-publish").removeClass("hide-me");
                            $("#previous").prop("disabled",true);
                        } else if (!($("#md_fields2").hasClass("hide-me"))) {
                            $("#md_fields2").addClass("hide-me");
                            $("#md_fields1").removeClass("hide-me");
                        } else if (!($("#final-page").hasClass("hide-me"))) {
                            $("#final-page").addClass("hide-me");
                            $("#md_fields2").removeClass("hide-me");
                            instructions.text("Add metadata to the file bundle.");
                            $("#next").text("Next");
                        }
                        return false;
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#files-page-publish").hasClass("hide-me")) {
                            local_data.validate_files("publish");
                            if($(".data-form-error").length === 0) {
                            	local_data.reset_associated_data("publish");
                                $("#files-page-publish").addClass("hide-me");
                                $("#md_fields1").removeClass("hide-me");
                                $("#previous").prop("disabled",false);
                                instructions.text("Add metadata to the file bundle.");
                            }
                        } else if(!$("#md_fields1").hasClass("hide-me")) {
                        	add_metadata.validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#md_fields1").addClass("hide-me");
                                $("#md_fields2").removeClass("hide-me");
                                add_metadata.save_metadata();
                            }
                        } else if(!$("#md_fields2").hasClass("hide-me")) {
                        	add_metadata.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                $("#md_fields2").addClass("hide-me");
                                $("#final-page").removeClass("hide-me");
                                add_metadata.save_metadata();
                                instructions.text("Publish your data.");
                                $("#next").text("Publish");
                            }
                        } else if (!$("#final-page").hasClass("hide-me")) {
                            $(".login-error").remove();
                            console.log("Submitting metadata: " + JSON.stringify(md.reportmetadata));
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();
                            var login_details = {
                                username: username_field_val,
                                password: password_field_val
                            };

                            var request = custom_contents.ldap_auth(login_details);

                            //wait for ldap request
                            request.then(function() { //success function
                                upload_data(login_details);

                                if(username_field_val !== config_username) {
                                    var config = {username: username_field_val};
                                    custom_contents.update_config(config);
                                }
                                //dismiss modal - can't return true since
                                //we're in a promise so dismiss it manually
                                $(".modal").modal("hide");
                            }).catch(function(reason) { //login failed
                                var error = $("<div/>")
                                    .addClass("login-error")
                                    .css("color","red");

                                error.text(reason.message);
                                $("#login-fields-upload-data").after(error);
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
            
            //init tree
            if (!md.reportmetadata.hasOwnProperty("files")) {
        		md.reportmetadata.files = [];
        	}
            
            local_data.init_data_form(md.reportmetadata.files, "publish");
        });

    };

    //register all the actions and set up the buttons
    var publish_action = {
        help: "Publish notebook and/or data",
        help_index: "a",
        icon: "fa-upload",
        handler : publish,
    };

    var publish_prefix = "linker_extension";
    var publish_action_name = "publish-bundle";


    var load = function () {
        Jupyter.notebook.keyboard_manager.actions.register(
            publish_action,
            publish_action_name,
            publish_prefix
        );
        $("#publish").click(function () {
            publish();
        });
    };

    module.exports = {
        load: load,
    };
});