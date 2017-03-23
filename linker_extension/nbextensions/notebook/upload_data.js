define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./view_data_dialog",
    "./add_metadata",
    "./modify_notebook_html",
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents,
    view_data,
    add_metadata) {

    //TODO: do required fields stuff

    /*  
     *  Create the upload data dialog. May get rid of later. Adds login details
     *  fields to the fields generated by upload_data_form and performs login
     *  validation.
     */ 
    var upload_data_dialog = function () {
        var upload_data_info = upload_data_form_alternate();

        var dialog_body = upload_data_info.dialog_body;

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

        dialog_body.append(login);

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

        var modal_obj = dialog.modal({
            title: "Upload Associated Data",
            body: dialog_body,
            default_button: "Cancel",
            buttons: {
                Cancel: {},
                Upload: { 
                    class : "btn-primary",
                    click: function() { //todo: remove this button or sort out username
                        $(".login-error").remove();
                        validate_upload_data();
                        if($(".data-form-error").length === 0) {
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();

                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            var data = get_values_from_fields_alternate();

                            //wait for ldap query to finish
                            request.then(function() { //success function
                                data.then(function(data_metadata) {
                                    data_metadata.username = username_field_val;
                                    data_metadata.password = password_field_val;
                                    data_metadata.notebookpath = Jupyter.notebook.notebook_path;
                                    var metadata = add_metadata.get_values_from_metadata();

                                    Object.keys(metadata).forEach(function(key) {
                                        if(!data_metadata.hasOwnProperty(key)) {
                                            data_metadata[key] = metadata[key];
                                        }
                                    });

                                    upload_data_alternate(data_metadata);

                                    if(username_field_val !== config_username) {
                                        var config = JSON.stringify({username: username_field_val});
                                        custom_contents.update_config(config).catch(
                                            function(reason){
                                                custom_utils.create_alert(
                                                    "alert-danger",
                                                    "Error! " + reason.message + 
                                                    ", please try again. If it " +
                                                    "continues to fail please " + 
                                                    "contact the developers.");
                                            }
                                        );
                                    }
                                    $(".modal").modal("hide");
                                }).catch(function() {
                                    //TODO: move this to apply to both file upload fields
                                    var error = $("<div/>")
                                        .addClass("upload-error")
                                        .css("color","red")
                                        .text("File upload failed - please try again.");
                                    $("label[for=\"TOS\"]").after(error);
                                });
                            }).catch(function(reason) { //fail function
                                var error = $("<div/>")
                                    .addClass("login-error")
                                    .css("color","red");

                                error.text(reason.message);
                                login.after(error);
                            });
                        }
                    }
                },
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.keyboard_manager,
        });

        modal_obj.on("shown.bs.modal", function () {
            //don't auto-dismiss when you click upload in case there's errors
            $(".modal-footer > .btn-primary").removeAttr("data-dismiss");
            //Multifile has to be initialised after it has been added to DOM
            $("#data-files").MultiFile({
                afterFileAppend: function(element, value, master_element) {
                    var new_val = $("#data-abstract").val() + value + "\n\n";
                    $("#data-abstract").val(new_val);
                },
                afterFileRemove: function(element, value, master_element) {
                    var new_val = $("#data-abstract").val().replace(value + "\n\n","");
                    $("#data-abstract").val(new_val);
                }
            });
            //id violates uniqueness rule so we change its name
            $("div#data-files").attr("id","data-files-wrap");
        });
    };

    /*  
     *  Extract the values from the form fields and return a promise that will
     *  have all the values in a single object once it is resolved.
     *  This is needed so we can wait for file upload to complete.
     */ 
    var get_values_from_fields = function() {
        var citations = [];
        $(".data-citation").each(function(i,e) {
            if($(e).val() !== "") {
                citations.push($(e).val());
            }
        });

        var abstract = $("#data-abstract").val();
        abstract = abstract + "\nCopyright: \n";
        abstract = abstract + $("#copyright").val();

        var licence = $("#data-licence-dropdown").val();

        var TOS_files = $("#TOS").prop("files");
        var TOS_files_contents = [];
        var promises = [];

        if(TOS_files) {
            for(var i = 0; i < TOS_files.length; i++) {
                var promise = new Promise(function(resolve,reject) {
                    var reader = new FileReader();

                    reader.onload = function(e) {
                        TOS_files_contents.push(e.target.result);
                        resolve(e.target.result);
                    };

                    reader.onerror = function() {
                        //TODO: handle error
                        reject();
                    };

                    reader.readAsDataURL(TOS_files[i]);
                });
                promises.push(promise);
            }
        }

        var wait_for_files = Promise.all(promises);

        return wait_for_files.then(
            function() {
                var data = {
                    "abstract": abstract,
                    "citations":citations,
                    "licence":licence,
                    "TOS": TOS_files_contents,
                };
                return data;
            }
        );
    };

    var get_values_from_fields_alternate = function() {
        var file_inputs = $("#data-files-wrap > input.MultiFile-applied");
        var files = [];
        var promises = [];
        file_inputs.each(function(index,item) {
            if($(item).prop("files").length) {
                var file = $(item).prop("files")[0];
                var promise = new Promise(function(resolve,reject) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var file_info = {};
                        file_info["file_name"] = file.name;
                        file_info["file_mimetype"] = file.type;
                        file_info["file_contents"] = e.target.result;
                        files.push(file_info);
                        resolve(e.target.result);
                    };

                    reader.onerror = function() {
                        //TODO: handle error
                        reject();
                    };

                    reader.readAsDataURL(file);
                    promises.push(promise);
                });
            }
        });

        var citations = [];
        $(".data-citation").each(function(i,e) {
            if($(e).val() !== "") {
                citations.push($(e).val());
            }
        });

        var abstract = $("#data-abstract").val();
        abstract = abstract + "\nCopyright: \n";
        abstract = abstract + $("#copyright").val();

        var licence = $("#data-licence-dropdown").val();

        var TOS_files = $("#TOS").prop("files");
        var TOS_files_contents = [];
        

        if(TOS_files) {
            for(var i = 0; i < TOS_files.length; i++) {
                var promise = new Promise(function(resolve,reject) {
                    var reader = new FileReader();

                    reader.onload = function(e) {
                        TOS_files_contents.push(e.target.result);
                        resolve(e.target.result);
                    };

                    reader.onerror = function() {
                        //TODO: handle error
                        reject();
                    };

                    reader.readAsDataURL(TOS_files[i]);
                });
                promises.push(promise);
            }
        }

        var wait_for_files = Promise.all(promises);

        return wait_for_files.then(
            function() {
                var data = {
                    "files": files,
                    "abstract": abstract,
                    "citations":citations,
                    "licence":licence,
                    "TOS": TOS_files_contents,
                };
                return data;
            }
        );
    };

     /*  
      *  Actually upload the data. Needs both reportmetadata to be set and for
      *  databundle to be set otherwise it shows errors. If data has already been
      *  uploaded it will also show an error. The data parameter is a Javasript
      *  object that contains all the metadata, plus some extra things like
      *  username and password. This is JSON.stringified before it is used 
      *  to make a request to our python handler.
      */  
    var upload_data = function(data) {
        var md = Jupyter.notebook.metadata;
        if ("databundle_url" in md) {
            //already uploaded to dspace so... TODO: do we want to block them if it"s already been uplaoded? should I grey out the button?
            custom_utils.create_alert("alert-warning",
                                      "You have already uploaded the associate " +
                                      "data for this notebook to eData and it " +
                                      "will not be reuploaded.");
        }
        else if ("reportmetadata" in md && "databundle" in md) {                    
            custom_contents.upload_data(JSON.stringify(data)).then(
                function(response) {
                    var id = "";
                    var xml_str = response.split("\n");
                    xml_str.forEach(function(item) {
                        if (item.indexOf("<atom:id>") !== -1) { // -1 means it"s not in the string
                            var endtag = item.lastIndexOf("<");
                            var without_endtag = item.slice(0,endtag);
                            var starttag = without_endtag.indexOf(">");
                            var without_starttag = without_endtag.slice(starttag + 1);
                            id = without_starttag;
                        }
                    });
                    md.databundle_url = id;
                    Jupyter.notebook.save_notebook();
                    custom_utils.create_alert("alert-success data-upload-success-alert",
                                              "Success! Item created in eData! " +
                                              "It is located here: <a href =\"" +
                                              id + "\">" + id + "</a>")
                                .attr("item-id",id);
                },
                function(reason) {
                    custom_utils.create_alert("alert-danger",
                                              "Error! " + reason.message + 
                                              ", please try again. If it " + 
                                              "continues to fail please " + 
                                              "contact the developers.");
                }
            );
        } else { 
            if (!("reportmetadata" in md)) {
                custom_utils.create_alert("alert-danger",
                                          "Error! No report metadata - please " +
                                          " fill in the report metadata first.");
            }
            if(!("databundle" in md)) {
                custom_utils.create_alert("alert-danger",
                                          "Error! No data associated with this " +
                                          "notebook. You must select data to " + 
                                          "upload before you an upload it."); 
            }
        }
    };

    var upload_data_alternate = function(data) {
        var md = Jupyter.notebook.metadata;
        if ("databundle_url" in md) {
            //already uploaded to dspace so... TODO: do we want to block them if it"s already been uplaoded? should I grey out the button?
            custom_utils.create_alert("alert-warning",
                                      "You have already uploaded the associate " +
                                      "data for this notebook to eData and it " +
                                      "will not be reuploaded.");
        }
        else if ("reportmetadata" in md) {                    
            custom_contents.upload_data_alternate(JSON.stringify(data)).then(
                function(response) {
                    var id = "";
                    var xml_str = response.split("\n");
                    xml_str.forEach(function(item) {
                        if (item.indexOf("<atom:id>") !== -1) { // -1 means it"s not in the string
                            var endtag = item.lastIndexOf("<");
                            var without_endtag = item.slice(0,endtag);
                            var starttag = without_endtag.indexOf(">");
                            var without_starttag = without_endtag.slice(starttag + 1);
                            id = without_starttag;
                        }
                    });
                    md.databundle_url = id;
                    Jupyter.notebook.save_notebook();
                    custom_utils.create_alert("alert-success data-upload-success-alert",
                                              "Success! Item created in eData! " +
                                              "It is located here: <a href =\"" +
                                              id + "\">" + id + "</a>")
                                .attr("item-id",id);
                },
                function(reason) {
                    custom_utils.create_alert("alert-danger",
                                              "Error! " + reason.message + 
                                              ", please try again. If it " + 
                                              "continues to fail please " + 
                                              "contact the developers.");
                }
            );
        } else { 
            if (!("reportmetadata" in md)) {
                custom_utils.create_alert("alert-danger",
                                          "Error! No report metadata - please " +
                                          " fill in the report metadata first.");
            }
        }
    };

    /*  
     *  Validates fields for the data metadata. Clears errors when run and adds
     *  errors beneath the labels of the relevant fields
     */ 
    var validate_upload_data = function() {
        $(".data-form-error").remove();

        //in case they delete the default abstract
        if($("#data-abstract").val() === "") {
            var abstract_error = $("<div/>")
                .attr("id","abstract-missing-error")
                .addClass("data-form-error")
                .text("Please enter and abstract");

            $("label[for=\"data-abstract\"]").after(abstract_error);
        }

        if($("#copyright").val() === "") {
            var copyright_error = $("<div/>")
                .attr("id","copyright-missing-error")
                .addClass("data-form-error")
                .text("Please enter copyright information");

            $("label[for=\"copyright\"]").after(copyright_error);
        }

        if($("#TOS").prop("files").length === 0) {
            var TOS_error = $("<div/>")
                .attr("id","TOS-missing-error")
                .addClass("data-form-error")
                .text("Please select the TOS files for the selected files");

            $("label[for=\"TOS\"]").after(TOS_error);
        }

        if($("#data-licence-dropdown").val() === "") {
            var licence_error = $("<div/>")
                .attr("id","licence-missing-error")
                .addClass("data-form-error")
                .text("Please select the licence for the selected files");

            $("label[for=\"data-licence-dropdown\"]").after(licence_error);
        }

        //TODO: what else do we force users to fill?

        $(".data-form-error").css("color", "red");
    };
    
    /*  
     *  Creates the form fields for data upload. Uses view_data to display
     *  the associated data files and also grab the info of the files selected.
     *  The rest is generating form fields for data metadata. It autofills
     *  abstract with each file name of the acciated files on a seperate line,
     *  and the rest of the fields have no defaults. Returns the dialog body
     *  and also passes along the file names, paths and types.
     */ 
    var upload_data_form = function() {
        var display_files = $("<div/>").attr("id","view-and-select-data")
            .append(
                $("<p/>").addClass("bundle-message")
                    .text("These are the files currently associated with " + 
                          Jupyter.notebook.notebook_name + " :"))
            .append($("<br/>"));

        var view_data_info = view_data.view_data();

        display_files.append(view_data_info.view_data_div);

        var file_names = view_data_info.file_names;
        var file_paths = view_data_info.file_paths;
        var file_types = view_data_info.file_types;
        var file_mimetypes = view_data_info.file_mimetypes;

        var abstract_label = $("<label/>")
            .attr("for","data-abstract")
            .addClass("required")
            .text("Please write an abstract here (You may want to write " +
                  " something to describe each file in the bundle): ");

        var abstract = $("<textarea/>")
            .attr("name","abstract")
            .attr("required","required")
            .attr("id","data-abstract");

        var default_abstract = "";
        file_names.forEach(function(item,index) {
            if(file_types[index] === "file") {
                default_abstract = default_abstract + item;
                if(index < file_names.length -1) {
                    default_abstract = default_abstract + "\n\n";
                }
            }
        });

        abstract.val(default_abstract);

        /*var referencedBy_divs = $("<div/>")
            .addClass("data-referencedBy_divs");

        var referencedBy_label = $("<label/>")
            .attr("for","data-referencedBy_divs")
            .text("Related publication persistent URLs: ");

        var referencedBy = $("<input/>")
            .addClass("data-referencedBy referencedBy")
            .attr("name","data-referencedBy")
            .attr("id","data-referencedBy-0");

        var referencedBy_div = $("<div/>")
            .addClass("data-referencedBy_div");

        var addURLButton = $("<button/>")
            .addClass("btn btn-xs btn-default add-referencedBy-button btn-add")
            .attr("id","add-data-referencedBy-button")
            .attr("type","button")
            .bind("click",addURL)
            .attr("aria-label","Add referencedBy URL");

        addURLButton.append($("<i>").addClass("fa fa-plus"));

        referencedBy_div.append(referencedBy);
        referencedBy_div.append(addURLButton);

        referencedBy_divs.append(referencedBy_div);

        var urlcount = 1;

        function addURL() {
            var newURL = ($("<div/>")).addClass("data-referencedBy_div");
            var URL = $("<input/>")
                .attr("class","data-referencedBy referencedBy")
                .attr("type","text")
                .attr("id","data-referencedBy-" + urlcount);

            var previousURL = $(".data-referencedBy_div").last();
            //detach from the previously last url input
            // so we can put it back on the new one
            addURLButton.detach();
            var deleteURL = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-referencedBy-button remove-data-referencedBy-button")
                .attr("type","button")
                    .click(function() {
                        previousURL.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteURL.append($("<i>")
                     .addClass("fa fa-trash")
                     .attr("aria-hidden","true"));

            previousURL.append(deleteURL);
            referencedBy_divs.append(newURL.append(URL).append(addURLButton));
            urlcount++;
            return [URL,newURL];
        }*/

        var licence_label = $("<label/>")
            .attr("for","data-licence-dropdown")
            .addClass("required")
            .text("Licence: ");

        //TODO: add licences fields

        //TODO: check that this list is sensible and has all the common
        //ones that users may select
        var licenceDropdown = $("<select/>")
            .attr("name","licence dropdown")
            .attr("id","data-licence-dropdown")
            .attr("required","required")
            .append($("<option/>").attr("value","").text("None Selected"))
            .append($("<option/>").attr("value","CC0").text("CC0"))
            .append($("<option/>").attr("value","CC BY").text("CC BY"))
            .append($("<option/>").attr("value","CC BY-SA").text("CC BY-SA"))
            .append($("<option/>").attr("value","CC BY-NC").text("CC BY-NC"))
            .append($("<option/>").attr("value","CC BY-ND").text("CC BY-ND"))
            .append($("<option/>").attr("value","CC BY-NC-SA").text("CC BY-NC-SA"))
            .append($("<option/>").attr("value","CC BY-NC-ND").text("CC BY-NC-ND"))
            .append($("<option/>").attr("value","Apache 2.0").text("Apache-2.0"))
            .append($("<option/>").attr("value","BSD-3-Clause").text("BSD-3-Clause"))
            .append($("<option/>").attr("value","BSD-2-Clause").text("BSD-2-Clause"))
            .append($("<option/>").attr("value","GPL-2.0").text("GPL-2.0"))
            .append($("<option/>").attr("value","GPL-3.0").text("GPL-3.0"))
            .append($("<option/>").attr("value","LGPL-2.1").text("LGPL-2.1"))
            .append($("<option/>").attr("value","LGPL-3.0").text("LGPL-3.0"))
            .append($("<option/>").attr("value","MIT").text("MIT"))
            .append($("<option/>").attr("value","MPL-2.0").text("MPL-2.0"))
            .append($("<option/>").attr("value","CDDL-1.0").text("CDDL-1.0"))
            .append($("<option/>").attr("value","EPL-1.0").text("EPL-1.0"));

        var TOS_label = $("<label/>")
            .attr("for","TOS")
            .addClass("required")
            .text("Terms of Service: ");

        var TOS_container = $("<div/>");
        var TOS_button = $("<span/>").addClass("btn btn-sm btn-default btn-file").text("Browse");
        var TOS_feedback = $("<input/>")
            .attr("readonly","readonly")
            .attr("type","text")
            .prop("disabled",true);
        var TOS = $("<input>")
            .attr("type","file")
            .attr("id","TOS")
            .attr("required","required")
            .attr("name","TOS[]")
            .attr("multiple","multiple");
        TOS_button.append(TOS);
        TOS_container.append(TOS_button).append(TOS_feedback);

        TOS.change(function() {
            var input = $(this);
            var numFiles = input.get(0).files ? input.get(0).files.length : 1;
            var label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
            input.trigger("fileselect", [numFiles, label]);
        });

        TOS.on("fileselect", function(event, numFiles, label) {
            var log = numFiles > 1 ? numFiles + " files selected" : label;

            TOS_feedback.val(log);
        });


        var citations_label = $("<label/>")
            .attr("for","data-citations")
            .text("Citations: ");

        var citations = $("<div/>").attr("id", "data-citations");

        var citation_div = $("<div/>").addClass("data-citation_div");

        var citation = $("<input/>")
            .addClass("data-citation citation")
            .attr("name","citation")
            .attr("id","data-citation-0");

        var addCitationButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-citation-button")
            .attr("id","add-data-citation-button")
            .attr("type","button")
            .bind("click",addCitation)
            .attr("aria-label","Add citation");

        addCitationButton.append($("<i>").addClass("fa fa-plus"));

        citation_div.append(citation);
        citation_div.append(addCitationButton);

        citations.append(citation_div);

        var citationCount = 1;

        function addCitation() {
            var newCitation_div = ($("<div/>")).addClass("data-citation_div");
            var newCitation = $("<input/>")
                .attr("class","data-citation citation")
                .attr("type","text")
                .attr("id","data-citation-" + citationCount);

            var previousCitation = $(".data-citation_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-citation-button remove-data-citation-button")
                .attr("type","button")
                .attr("aria-label","Remove citation")
                    .click(function() {
                        previousCitation.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteCitation.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previousCitation.append(deleteCitation);
            citations.append(newCitation_div.append(newCitation).append(addCitationButton));
            citationCount++;

            return [newCitation,newCitation_div];
        }

        var copyright_label = $("<label/>")
            .attr("for","copyright")
            .addClass("required")
            .text("Copyright: ");

        var copyright = $("<textarea/>")
            .attr("id","copyright")
            .attr("required","required")
            .attr("name","copyright");

        var data_fields = $("<fieldset/>")
            .attr("title","data_fields").attr("id","data_fields")
            .append(abstract_label)
            .append(abstract)
            //.append(referencedBy_label)
            //.append(referencedBy_divs)
            .append(licence_label)
            .append(licenceDropdown)
            .append(TOS_label)
            .append(TOS_container)
            .append(citations_label)
            .append(citations)
            .append(copyright_label)
            .append(copyright);

        var dialog_body = $("<div/>")
            .append(display_files)
            .append(data_fields);

        return {dialog_body: dialog_body,
                file_names: file_names,
                file_paths: file_paths, 
                file_types: file_types,
                file_mimetypes: file_mimetypes};
    };

    var upload_data_form_alternate = function() {
        var files_page = $("<fieldset/>").attr("id","files-page");
        var metadata_page = $("<fieldset/>").addClass("hide-me").attr("id","metadata-page");

        var files = $("<input/>")
            .attr("id","data-files")
            .attr("required","required")
            .attr("name","data-files[]")
            .attr("type","file");

        var files_button = $("<span/>").addClass("btn btn-sm btn-default btn-file").text("Browse");

        var files_list = $("<div>")
            .attr("id","data-files-list");

        files_button.append(files);

        files_page.append(files_button).append(files_list);

        var abstract_label = $("<label/>")
            .attr("for","data-abstract")
            .addClass("required")
            .text("Please write an abstract here (You may want to write " +
                  " something to describe each file in the bundle): ");

        var abstract = $("<textarea/>")
            .attr("name","abstract")
            .attr("required","required")
            .attr("id","data-abstract");

        var licence_label = $("<label/>")
            .attr("for","data-licence-dropdown")
            .addClass("required")
            .text("Licence: ");

        //TODO: add licences fields

        //TODO: check that this list is sensible and has all the common
        //ones that users may select
        var licenceDropdown = $("<select/>")
            .attr("name","licence dropdown")
            .attr("id","data-licence-dropdown")
            .attr("required","required")
            .append($("<option/>").attr("value","").text("None Selected"))
            .append($("<option/>").attr("value","CC0").text("CC0"))
            .append($("<option/>").attr("value","CC BY").text("CC BY"))
            .append($("<option/>").attr("value","CC BY-SA").text("CC BY-SA"))
            .append($("<option/>").attr("value","CC BY-NC").text("CC BY-NC"))
            .append($("<option/>").attr("value","CC BY-ND").text("CC BY-ND"))
            .append($("<option/>").attr("value","CC BY-NC-SA").text("CC BY-NC-SA"))
            .append($("<option/>").attr("value","CC BY-NC-ND").text("CC BY-NC-ND"))
            .append($("<option/>").attr("value","Apache 2.0").text("Apache-2.0"))
            .append($("<option/>").attr("value","BSD-3-Clause").text("BSD-3-Clause"))
            .append($("<option/>").attr("value","BSD-2-Clause").text("BSD-2-Clause"))
            .append($("<option/>").attr("value","GPL-2.0").text("GPL-2.0"))
            .append($("<option/>").attr("value","GPL-3.0").text("GPL-3.0"))
            .append($("<option/>").attr("value","LGPL-2.1").text("LGPL-2.1"))
            .append($("<option/>").attr("value","LGPL-3.0").text("LGPL-3.0"))
            .append($("<option/>").attr("value","MIT").text("MIT"))
            .append($("<option/>").attr("value","MPL-2.0").text("MPL-2.0"))
            .append($("<option/>").attr("value","CDDL-1.0").text("CDDL-1.0"))
            .append($("<option/>").attr("value","EPL-1.0").text("EPL-1.0"));

        var TOS_label = $("<label/>")
            .attr("for","TOS")
            .addClass("required")
            .text("Terms of Service: ");

        var TOS_container = $("<div/>");
        var TOS_button = $("<span/>").addClass("btn btn-sm btn-default btn-file").text("Browse");
        var TOS_feedback = $("<input/>")
            .attr("readonly","readonly")
            .attr("type","text")
            .prop("disabled",true);
        var TOS = $("<input>")
            .attr("type","file")
            .attr("id","TOS")
            .attr("required","required")
            .attr("name","TOS[]")
            .attr("multiple","multiple");
        TOS_button.append(TOS);
        TOS_container.append(TOS_button).append(TOS_feedback);

        TOS.change(function() {
            var input = $(this);
            var numFiles = input.get(0).files ? input.get(0).files.length : 1;
            var label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
            input.trigger("fileselect", [numFiles, label]);
        });

        TOS.on("fileselect", function(event, numFiles, label) {
            var log = numFiles > 1 ? numFiles + " files selected" : label;

            TOS_feedback.val(log);
        });


        var citations_label = $("<label/>")
            .attr("for","data-citations")
            .text("Citations: ");

        var citations = $("<div/>").attr("id", "data-citations");

        var citation_div = $("<div/>").addClass("data-citation_div");

        var citation = $("<input/>")
            .addClass("data-citation citation")
            .attr("name","citation")
            .attr("id","data-citation-0");

        var addCitationButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-citation-button")
            .attr("id","add-data-citation-button")
            .attr("type","button")
            .bind("click",addCitation)
            .attr("aria-label","Add citation");

        addCitationButton.append($("<i>").addClass("fa fa-plus"));

        citation_div.append(citation);
        citation_div.append(addCitationButton);

        citations.append(citation_div);

        var citationCount = 1;

        function addCitation() {
            var newCitation_div = ($("<div/>")).addClass("data-citation_div");
            var newCitation = $("<input/>")
                .attr("class","data-citation citation")
                .attr("type","text")
                .attr("id","data-citation-" + citationCount);

            var previousCitation = $(".data-citation_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-citation-button remove-data-citation-button")
                .attr("type","button")
                .attr("aria-label","Remove citation")
                    .click(function() {
                        previousCitation.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteCitation.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previousCitation.append(deleteCitation);
            citations.append(newCitation_div.append(newCitation).append(addCitationButton));
            citationCount++;

            return [newCitation,newCitation_div];
        }

        var copyright_label = $("<label/>")
            .attr("for","copyright")
            .addClass("required")
            .text("Copyright: ");

        var copyright = $("<textarea/>")
            .attr("id","copyright")
            .attr("required","required")
            .attr("name","copyright");

        metadata_page.append(abstract_label)
                     .append(abstract)
                     //.append(referencedBy_label)
                     //.append(referencedBy_divs)
                     .append(licence_label)
                     .append(licenceDropdown)
                     .append(TOS_label)
                     .append(TOS_container)
                     .append(citations_label)
                     .append(citations)
                     .append(copyright_label)
                     .append(copyright);

        return {files_page: files_page, metadata_page: metadata_page};
    };

    module.exports = {
        upload_data_dialog: upload_data_dialog,
        upload_data_form: upload_data_form,
        upload_data: upload_data,
        upload_data_alternate: upload_data_alternate,
        upload_data_form_alternate: upload_data_form_alternate,
        get_values_from_fields_alternate: get_values_from_fields_alternate,
        validate_upload_data: validate_upload_data,
        get_values_from_fields: get_values_from_fields,
    };
});