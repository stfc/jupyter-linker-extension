define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "../custom_utils",
        "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_contents,custom_utils){
	var files_to_download;
	
	var create_urls = function (id, failed_downloads) {
        var urls_label = $("<label/>")
            .attr("for","download_data_form")
            .text("Provide a set of eData URIs or DOIs. The data from these entries will be made available to the notebook.");
		
		var download_urls = $("<div/>").attr("id", id + "-urls")
		                               .addClass("download-page");

        var download_url_container = $("<div/>").addClass(id + "-url-container");

        var download_url = $("<input/>")
            .addClass("download-url")
            .attr("type","text")
            .attr("name", id + " url")
            .attr("id", id + "-url-0");

        var add_download_URL_button = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-download-url-button")
            .attr("id","download-url-button")
            .attr("type","button")
            .attr("aria-label","Add URL")
            .click(function() {
                addDownloadURL();
            });

        add_download_URL_button.append($("<i>").addClass("fa fa-plus"));

        download_url_container.append(download_url);
        download_url_container.append(add_download_URL_button);

        download_urls.append(urls_label).append(download_url_container);

        var download_url_count = 1;
        function addDownloadURL(previous_download_url) {
            var new_download_url_container = $("<div/>").addClass(id + "-url-container");
            var new_download_url = $("<input/>")
                .attr("class","download-url")
                .attr("type","text")
                .attr("id",id +"-url-" + download_url_count);

            if (previous_download_url === undefined) {
                previous_download_url = $("." + id +"-url-container").last();
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
        
        return download_urls;
	}
	
	var dspace_url = "";
	
	var create_login_details = function() {
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
        
        return login;
	}
	
	var uploaded_files;
	
	var create_file_input = function () {
        var input_files = $("<div/>").attr("id","input-files")
                                     .addClass("download-page");
        
        var test = function () {      	
        	if ($(this).get(0) == undefined ||
        		$(this).get(0).files == undefined) {
        		return;
        	} else {
        		files_to_download = $(this).get(0).files;
        	}
        	
        	console.log("Input files changed");
        	var promises = [];
        	var files_to_submit = [];
            for (var i = 0; i < files_to_download.length; i++) {
                var file = files_to_download[i];
                console.log("New file found");
                console.log(file);
                
                var promise = new Promise(function(resolve,reject) {
	                var reader = new FileReader();
	
	                reader.onload = function(e) {
	                    var file_info = {};
	                    file_info["file_name"] = file.name;
	                    file_info["file_mimetype"] = file.type;
	                    file_info["file_contents"] = e.target.result;
	                    files_to_submit.push(file_info);
	                    resolve (file_info);
	                };
	
	                reader.readAsDataURL(file);
                });
                
                promises.push(promise);
            }
            
            Promise.all(promises).then(
            	function() {
            		files_to_download = files_to_submit;
            	}
            );
            
            
        }
        
        var input = $("<input/>").attr("type", "file")
                                 .attr("id", "file-input")
                                 .attr("multiple", true)
                                 .change(test);
               
        input_files.append(input);
        
        return input_files;
	}
	
	var create_tabs = function(failed_downloads) {
        var tab_list = $("<ul/>").addClass("nav nav-tabs");
        
        function add_item(id, display, active) {
        	var new_item = $("<li/>");
        	new_item.append($("<a/>").attr("data-toggle", "tab")
        			                 .attr("href", "#" + id)
        			                 .text(display)
        			                 .addClass("datatab"));
        	if (active) {
        		new_item.addClass("active");
        	}
        	
        	tab_list.append(new_item);
        }
        
        add_item("dspace-tab", "eData", true);
        add_item("local-tab", "Local Files");
        
        dspace_form = $("<div/>");
        dspace_form.append(
            $("<form/>").attr("id","download_data_form")
                        .append(create_urls("dspace", failed_downloads)
                                .append(create_login_details())));
        dspace_form.addClass("tab-pane fade in active").attr("id", "dspace-tab");

        local_form = $("<div/>");
        local_form.append(
            $("<form/>").attr("id","local_data_form")
                        .append(create_file_input()));
        local_form.addClass("tab-pane fade").attr("id","local-tab");
        
        tab_content = $("<div/>").addClass("tab-content")
                                 .append(dspace_form)
                                 .append(local_form);
        
        var form_body = $("<div/>")
            .append(tab_list)
            .append(tab_content);
        
        return form_body;
	}
	
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
        } else if(dspace_url != "" && url.search(url_regex) !== -1) {
            return true;
        } else {
            return false;
        }
    };
    
    var submit_files = function() {
    	if (files_to_download != undefined) {
        	console.log("Submitting data:");
        	custom_contents.import_data({
                files: files_to_download,
            }).then(function(response) {
                Object.keys(response).forEach(function(key) {
                    var result = response[key];
                    if(result.error) {
                        custom_utils.create_alert(
                            "alert-danger download-failure-alert",
                            result.message + " while importing " +
                            result.name + " (<a href=\"" + key + 
                            "\" class=\"alert-link\">"+ key + 
                            "</a>)").attr("id",key);
                    } else {
                        custom_utils.create_alert(
                            "alert-success download-success-alert",
                            result.message + " <a href=\"" + key +  
                            "\"class=\"alert-link\">" + key +
                            "</a> imported from local files.");
                    }
                });
                files_to_download = [];
            });
            //dismiss modal - can't return true since
            //we're in a promise so dismiss it manually
            $(".modal").modal("hide");
    	}
    }
    
    var submit_dspace = function() {
        $(".download-form-error").remove();
        var urls = [];

        $(".download-url").each(function(index,item) {
            var curr_url = $(item).val().trim();
            
            if(validate_url(curr_url)) {
                urls.push(curr_url);
            } else if (curr_url !== "") {
                //ignore blank inputs
                var error = $("<div/>")
                    .addClass("download-form-error")
                    .css("color","red")
                    .text("URL or DOI is not valid for eData");

                $(item).before(error);
            }
        });

        if($(".download-form-error").length === 0 &&
           urls.length > 0) {
            $(".login-error").remove();
            var username_field_val = $("#username").val();
            var password_field_val = $("#password").val();

            var login_details = {
                username: username_field_val,
                password: password_field_val
            };

            var login_request = custom_contents.ldap_auth(login_details);

            var path = "";
            
            if (Jupyter.notebook != undefined) {
            	path = Jupyter.notebook.notebook_path;
            }
            
            login_request.then(function() { //success function
                custom_contents.download_data({
                    URLs: urls,
                    username: $("#username").val(),
                    password: $("#password").val(),
                    notebookpath: path
                }).then(function(response) {
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
                        }
                    });

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
    }
    
    var submit = function() {
    	submit_files();
    	submit_dspace();
    }
    
    var data_modal = function(failed_downloads) {        
        var modal = dialog.modal({
            title: "Import external data for use in the notebook",
            body: create_tabs(failed_downloads),
            buttons: {
                Cancel: {},
                Download: { 
                    class : "btn-primary",
                    click: submit,
                }
            },
            keyboard_manager: Jupyter.keyboard_manager,
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

    /*  
     *  The below adds an action to the notebook and assigns the add_metadata
     *  function to the Add metadata function, and handles exporting the
     *  functions we use in other modules/files.
     */

    var download_action = {
        help: "Download data from urls/dois",
        help_index: "a",
        icon: "fa-download",
        handler : data_modal,
    };

    var download_prefix = "linker_extension";
    var download_action_name = "download-data";


    var load = function () {
        Jupyter.keyboard_manager.actions.register(download_action,download_action_name,download_prefix);
        $("#download_data").click(function () {
            data_modal([]);
        });
    };

    module.exports = {
        load: load,
        data_modal: data_modal,
    };
});