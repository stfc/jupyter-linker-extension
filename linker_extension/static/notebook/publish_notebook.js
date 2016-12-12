define(['base/js/namespace',
		'base/js/utils',
		'base/js/dialog',
		'../custom_contents',
		'./view_data_dialog',
		'./add_metadata',
		'./select_data_notebook',
		'./upload_notebook',
		'./upload_data',
		'./modify_notebook_html'],
function(Jupyter,utils,dialog,custom_contents,view_data,add_metadata,select_data,upload_notebook,upload_data){

		//Publish. Gives users a last chance to add metadata or associate files before uploading notebook and data to dspace.

	var publish_notebook_and_bundle = function() {
		var add_metadata_form_fields = add_metadata.create_fields();
		add_metadata_form_fields.form1.addClass("hide-me");
		add_metadata_form_fields.form2.addClass("hide-me");

		var instructions = $("<label/>").attr("id","publish_instructions").attr('for','publish_form');
		instructions.text("Check the files currently associated with this notebook and add additional metadata for the zip file contianing all the following files. Click the 'Select Data' button to navigate away from this page to select additional data to associate with this notebook");

		var view_data_info = view_data.view_data();
		var upload_data_info = upload_data.upload_data_form(); 

        var upload_data_container = $("<div/>").attr("id","upload-data-container");

		var form_body = $('<div/>').attr('title', 'Publish notebook')
        .append(
            $('<form id="publish_form"/>')
                    .append(instructions)
                    .append(upload_data_container)
                    .append(add_metadata_form_fields.form1)
                    .append(add_metadata_form_fields.form2)
        );

        var url_arr = window.location.pathname.split("/");
		var username = "";

		var final_page = $("<div/>").attr("id","final-page");
		final_page.addClass("hide-me");
		
		if(url_arr[0] === "user") { //means we're in jupyterhub - so we don't need to request for username or pass
			username = url_arr[1];
		} else {
			var login_fields = $("<div/>").attr("id","login-fields");
			var username_label = $("<label/>").attr("for","username").text("Username: ");
			var username_field = $("<input/>").attr("id","username");
			var password_label = $("<label/>").attr("for","password").text("Password: ");
			var password_field = $("<input/>").attr("id","password");

			login_fields.append(username_label).append(username_field).append(password_label).append(password_field);
			final_page.append(login_fields);
		}

		form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Notebook",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { click: function() {
                                if(!$("#upload-data-container").hasClass("hide-me")) { //make a multi page form by changing visibility of the forms
                                    $("#previous").addClass("disabled"); //can't go back when we're on the first page
                                } 
                                else if($("upload-data-container").hasClass("hide-me") && !$("#fields1").hasClass("hide-me")) {
                                	$("#fields1").addClass("hide-me");
                                    $("#upload-data-container").removeClass("hide-me");
                                    instructions.text("Check the files currently associated with this notebook. Click the 'Select Data' button to navigate away from this page to select additional data to associate with this notebook");
                                }
                                else if($("#fields1").hasClass("hide-me") && !$("#fields2").hasClass("hide-me")) {
                                    $("#fields2").addClass("hide-me");
                                    $("#fields1").removeClass("hide-me");
                                }
                                else if($("#fields2").hasClass("hide-me") && !$("#final-page").hasClass("hide-me")) {
                                    $("#final-page").addClass("hide-me");
                                    $("#fields2").removeClass("hide-me");
                                    $("#next").text("Next"); //we want next to be next on any page but the last one
                                }
                            }
                },
                Next: { class : "btn-primary",
                        click: function() {
                        	if(!$("#upload-data-container").hasClass("hide-me")) {
                        		Jupyter.notebook.metadata.bundle_metadata = {};
                        		Jupyter.notebook.metadata.bundle_metadata.abstract = $("#data_abstract").val();
                        		var referencedBy_URLs = [];
					            $('.data_referencedBy').each(function(i,e) {
					                referencedBy_URLs.push($(e).val());
					            });
                        		Jupyter.notebook.metadata.bundle_metadata.referencedBy = referencedBy_URLs;
                        		//TODO: do we need to save this metadata or not? ask

                        		$("#upload-data-container").addClass("hide-me");
				                $("#fields1").removeClass("hide-me");
				                $("#previous").removeClass("disabled");
				                instructions.text("Check and edit the metadata for the notebook before uploading to eData.");
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
						            $("#next").text("Publish"); //we want next to be save on the last page
					            }
                        	}
                        	else if (!$("#final-page").hasClass("hide-me")) {
                        		//do login validation and publishing here!
                        		$(".login-error").remove();
                        		if(!username) {
									var request = custom_contents.ldap_auth(JSON.stringify({username: $("#username_field").val(), password: $("#password_field").val()}));

									request.then(
											function() { //success function
												upload_notebook.upload_notebook($("#username_field").val());
				                				upload_data.upload_data($("#username_field").val(),upload_data_info.file_names,upload_data_info.file_paths,upload_data_info.file_types);
				                				$(".modal").modal("hide");
											},
											function(reason) { //fail function
												if (reason.xhr.status === 401) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not receognised.").css("color","red"));
			                        			} else if (reason.xhr.status === 400) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not valid.").css("color","red"));
			                        			} else {
			                        				//shouldn't really get here?
			                        				instructions.after($("<div/>").addClass("login-error").text("Login failed - please try again.").css("color","red"));
			                        			}
											}
										);
                        		} else {
                        			//if we're in jupyterhub don't have to authenticate again - just use username we got from URL
									upload_notebook.upload_notebook(username);
	                				upload_data.upload_data(username,upload_data_info.file_names,upload_data_info.file_paths,upload_data_info.file_types);
	                				$(".modal").modal("hide");
                        		}
			            	}
                    	},
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

		modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss").attr("id","previous");
			$(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss").attr("id","next");
        });

	};

	var publish_notebook = function() {
		var add_metadata_form_fields = add_metadata.create_fields();
		add_metadata_form_fields.form2.addClass("hide-me");

		var instructions = $("<label/>").attr("id","publish_instructions").attr('for','publish_form');
		instructions.text("Check the files currently associated with this notebook and add additional metadata for the zip file contianing all the following files. Click the 'Select Data' button to navigate away from this page to select additional data to associate with this notebook");

		var view_data_info = view_data.view_data();

		var form_body = $('<div/>').attr('title', 'Publish notebook')
        .append(
            $('<form id="publish_form"/>')
                    .append(instructions)
                    .append(add_metadata_form_fields.form1)
                    .append(add_metadata_form_fields.form2)
        );

        var url_arr = window.location.pathname.split("/");
		var username = "";

		var final_page = $("<div/>").attr("id","final-page");
		final_page.addClass("hide-me");
		
		if(url_arr[0] === "user") { //means we're in jupyterhub - so we don't need to request for username or pass
			username = url_arr[1];
		} else {
			var login_fields = $("<div/>").attr("id","login-fields");
			var username_label = $("<label/>").attr("for","username_field").text("Username: ");
			var username_field = $("<input/>").attr("id","username_field");
			var password_label = $("<label/>").attr("for","password_field").text("Password: ");
			var password_field = $("<input/>").attr("id","password_field").attr("type","password");

			login_fields.append(username_label).append(username_field).append(password_label).append(password_field);
			final_page.append(login_fields);
		}

		form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Notebook",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { click: function() {
                                if(!$("#fields1").hasClass("hide-me")) { //make a multi page form by changing visibility of the forms
                                    $("#previous").addClass("disabled"); //can't go back when we're on the first page
                                } 
                                else if($("#fields1").hasClass("hide-me") && !$("#fields2").hasClass("hide-me")) {
                                    $("#fields2").addClass("hide-me");
                                    $("#fields1").removeClass("hide-me");
                                }
                                else if($("#fields2").hasClass("hide-me") && !$("#final-page").hasClass("hide-me")) {
                                    $("#final-page").addClass("hide-me");
                                    $("#fields2").removeClass("hide-me");
                                    $("#next").text("Next"); //we want next to be next on any page but the last one
                                }
                            }
                },
                Next: { class : "btn-primary",
                        click: function() {
                        	if (!$("#fields1").hasClass("hide-me")) {
                        		add_metadata.validate_fields1();
                        		if($(".metadata-form-error").length === 0) {
					                $("#fields1").addClass("hide-me");
					                $("#fields2").removeClass("hide-me");
					                $("#previous").removeClass("disabled");
					            }
                        	}  else if (!$("#fields2").hasClass("hide-me")) {
                        		add_metadata.validate_fields2();
                        		if($(".metadata-form-error").length === 0) {
					                $("#fields2").addClass("hide-me");
					                $("#final-page").removeClass("hide-me");
						            $("#next").text("Publish"); //we want next to be save on the last page
					            }
                        	}
                        	else if (!$("#final-page").hasClass("hide-me")) {
                        		//do login validation and publishing here!
                        		$(".login-error").remove();
                        		if(!username) {
									var request = custom_contents.ldap_auth(JSON.stringify({username: $("#username_field").val(), password: $("#password_field").val()}));

									request.then(
											function() { //success function
												upload_notebook.upload_notebook($("#username_field").val());
				                				$(".modal").modal("hide");
											},
											function(reason) { //fail function
												if (reason.xhr.status === 401) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not receognised.").css("color","red"));
			                        			} else if (reason.xhr.status === 400) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not valid.").css("color","red"));
			                        			} else {
			                        				//shouldn't really get here?
			                        				instructions.after($("<div/>").addClass("login-error").text("Login failed - please try again.").css("color","red"));
			                        			}
											}
										);
                        		} else {
                        			//if we're in jupyterhub don't have to authenticate again - just use username we got from URL

                        			upload_notebook.upload_notebook(username);
	                				$(".modal").modal("hide");
                        		}
			            	}
                    	},
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

		modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss").attr("id","previous");
			$(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss").attr("id","next");
        });

	};

	var publish_bundle = function() {
		var instructions = $("<label/>").attr("id","publish_instructions").attr('for','publish_form');
		instructions.text("Check the files currently associated with this notebook and add additional metadata for the zip file contianing all the following files. Click the 'Select Data' button to navigate away from this page to select additional data to associate with this notebook");

		var view_data_info = view_data.view_data();
		var upload_data_info = upload_data.upload_data_form(); 

        var upload_data_container = $("<div/>").attr("id","upload-data-container");

		var form_body = $('<div/>').attr('title', 'Publish data')
        .append(
            $('<form id="publish_form"/>')
                    .append(instructions)
                    .append(upload_data_container)
        );

        var url_arr = window.location.pathname.split("/");
		var username = "";

		var final_page = $("<div/>").attr("id","final-page");
		final_page.addClass("hide-me");
		
		if(url_arr[0] === "user") { //means we're in jupyterhub - so we don't need to request for username or pass
			username = url_arr[1];
		} else {
			var login_fields = $("<div/>").attr("id","login-fields");
			var username_label = $("<label/>").attr("for","username").text("Username: ");
			var username_field = $("<input/>").attr("id","username");
			var password_label = $("<label/>").attr("for","password").text("Password: ");
			var password_field = $("<input/>").attr("id","password");

			login_fields.append(username_label).append(username_field).append(password_label).append(password_field);
			final_page.append(login_fields);
		}

		form_body.append(final_page);

        var modal = dialog.modal({
            title: "Publish Notebook",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { click: function() {
                                if(!$("#upload-data-container").hasClass("hide-me")) { //make a multi page form by changing visibility of the forms
                                    $("#previous").addClass("disabled"); //can't go back when we're on the first page
                                } 
                                else if($("upload-data-container").hasClass("hide-me") && !$("#final-page").hasClass("hide-me")) {
                                    $("#final-page").addClass("hide-me");
                                    $("#upload-data-container").removeClass("hide-me");
                                    $("#next").text("Next"); //we want next to be next on any page but the last one
                                }
                            }
                },
                Next: { class : "btn-primary",
                        click: function() {
                        	if(!$("#upload-data-container").hasClass("hide-me")) {
                        		Jupyter.notebook.metadata.bundle_metadata = {};
                        		Jupyter.notebook.metadata.bundle_metadata.abstract = $("#data_abstract").val();
                        		var referencedBy_URLs = [];
					            $('.data_referencedBy').each(function(i,e) {
					                referencedBy_URLs.push($(e).val());
					            });
                        		Jupyter.notebook.metadata.bundle_metadata.referencedBy = referencedBy_URLs;
                        		//TODO: do we need to save this metadata or not? ask

                        		$("#upload-data-container").addClass("hide-me");
				                $("#final-page").removeClass("hide-me");
				                $("#previous").removeClass("disabled");
				                instructions.text("Confirm that you would like to upload the data bundle.");
				                $("#next").text("Publish"); //we want next to be save on the last page
                        	}

                        	else if (!$("#final-page").hasClass("hide-me")) {
                        		//do login validation and publishing here!
                        		$(".login-error").remove();
                        		if(!username) {
									var request = custom_contents.ldap_auth(JSON.stringify({username: $("#username_field").val(), password: $("#password_field").val()}));

									request.then(
											function() { //success function
				                				upload_data.upload_data($("#username_field").val(),upload_data_info.file_names,upload_data_info.file_paths,upload_data_info.file_types);
				                				$(".modal").modal("hide");
											},
											function(reason) { //fail function
												if (reason.xhr.status === 401) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not receognised.").css("color","red"));
			                        			} else if (reason.xhr.status === 400) { //unauthorised
			                        				//you dun goofed on ur login
			                        				instructions.after($("<div/>").addClass("login-error").text("Login details not valid.").css("color","red"));
			                        			} else {
			                        				//shouldn't really get here?
			                        				instructions.after($("<div/>").addClass("login-error").text("Login failed - please try again.").css("color","red"));
			                        			}
											}
										);
                        		} else {
                        			//if we're in jupyterhub don't have to authenticate again - just use username we got from URL

	                				upload_data.upload_data(username,upload_data_info.file_names,upload_data_info.file_paths,upload_data_info.file_types);
	                				$(".modal").modal("hide");
                        		}
			            	}
                    	},
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

		modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss").attr("id","previous");
			$(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss").attr("id","next");
        });

	};

	var action = {
        help: 'Publish notebook',
        help_index: 'a',
        icon: 'fa-upload',
        handler : publish_notebook,
    };

    var prefix = "linker_extension";
    var action_name = "publish-notebook";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);

    action = {
        help: 'Publish data bundle',
        help_index: 'a',
        icon: 'fa-upload',
        handler : publish_bundle,
    };

    prefix = "linker_extension";
    action_name = "publish-bundle";
    full_action_name = Jupyter.actions.register(action,action_name,prefix);

    action = {
        help: 'Publish notebook and data bundle',
        help_index: 'a',
        icon: 'fa-upload',
        handler : publish_notebook_and_bundle,
    };

    prefix = "linker_extension";
    action_name = "publish-notebook-and-data-bundle";
    full_action_name = Jupyter.actions.register(action,action_name,prefix);

    var load = function () {
        $('#publish_notebook').click(function () {
            publish_notebook();
        });
        $('#publish_bundle').click(function () {
            publish_bundle();
        });
        $('#publish_notebook_and_bundle').click(function () {
            publish_notebook_and_bundle();
        });
    };

    module.exports = {
        load: load,
    };
});