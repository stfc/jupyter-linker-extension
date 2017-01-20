define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./view_data_dialog",
    "./modify_notebook_html",
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents,
    view_data) {

    var Promise = require("es6-promise").Promise;

    var upload_data_dialog = function () {
        var upload_data_info = upload_data_form();

        var dialog_body = upload_data_info.dialog_body;

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

        dialog_body.append(login);

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

                            request.then(
                                function() { //success function
                                    upload_data(
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
                                        error.text("Login details not recognised.");
                                        login_fields.after(error);
                                    } else if (reason.xhr.status === 400) { //unauthorised
                                        //you dun goofed on ur login
                                        error.text("Login details not valid.");
                                        login_fields.after(error);
                                    } else {
                                        console.log(reason);
                                        console.log(reason.text);
                                        //shouldn't really get here?
                                        error.text("Login failed - please try again.");
                                        login_fields.after(error);
                                    }
                                }
                            );
                        }
                    }
                },
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.keyboard_manager,
        });

        modal_obj.on("shown.bs.modal", function () {
            //don't auto-dismiss when you click upload
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss");
        });
    };

    var upload_data = function(
        username,
        password,
        file_names,
        file_paths,
        file_types
    ) {
        var md = Jupyter.notebook.metadata;
        if ("databundle_url" in md) {
            //already uploaded to dspace so... TODO: do we want to block them if it"s already been uplaoded? should I grey out the button?
            custom_utils.create_alert("alert-warning",
                                      "You have already uploaded the associate " +
                                      "data for this notebook to eData and it " +
                                      "will not be reuploaded.");
        }
        else if ("reportmetadata" in md && "databundle" in md) {
            var stringauthors = [];
            var authors = md.reportmetadata.authors;
            authors.forEach(function(author) {
                var authorstring = author[0] + ", " + author[1];
                stringauthors.push(authorstring); 
            });

            var referencedBy_URLs = [];
            $(".referencedBy").each(function(i,e) {
                if($(e).val() !== "") {
                    referencedBy_URLs.push($(e).val());
                }
            });

            var citations = [];
            $(".citation").each(function(i,e) {
                if($(e).val() !== "") {
                    citations.push($(e).val());
                }
            });

            var abstract = $("#abstract").val();
            abstract = abstract + "\nCopyright: \n";
            abstract = abstract + $("#copyright").val();

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

            wait_for_files.then(
                function() {
                    var data = JSON.stringify({
                        "username": username,
                        "password": password,
                        "notebookpath": Jupyter.notebook.notebook_path,
                        "file_names": file_names,
                        "file_paths": file_paths,
                        "file_types": file_types,
                        "abstract": abstract,
                        "referencedBy": referencedBy_URLs,
                        "title":md.reportmetadata.title,
                        "authors":stringauthors,
                        "tags":md.reportmetadata.tags,
                        "date":md.reportmetadata.date,
                        "language":md.reportmetadata.language,
                        "publisher":md.reportmetadata.publisher,
                        "citations":citations,
                        "funders":md.reportmetadata.funders,
                        "sponsors":md.reportmetadata.sponsors,
                        "repository":md.reportmetadata.repository,
                        "TOS": TOS_files_contents,
                    });
                    
                    custom_contents.upload_data(data).then(
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
                            custom_utils.create_alert("alert-success",
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
                },
                function() {
                    custom_utils.create_alert("alert-danger",
                                              "Error! File upload failed" + 
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

    var validate_upload_data = function() {
        $(".data-form-error").remove();

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

        //TODO: what else do we force users to fill?

        $(".data-form-error").css("color", "red");
    };
    

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

        var abstract_label = $("<label/>")
            .attr("for","abstract")
            .text("Please write an abstract here (You may want to write " +
                  " something to describe each file in the bundle): ");

        var abstract = $("<textarea/>")
            .attr("name","abstract")
            .attr("id","abstract");

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

        var referencedBy_label = $("<label/>")
            .attr("for","referencedBy")
            .text("Related publication persistent URLs: ");

        var referencedBy = $("<input/>")
            .addClass("referencedBy")
            .attr("name","referencedBy")
            .attr("id","referencedBy-0");

        var referencedBy_div = $("<div/>")
            .addClass("referencedBy_div");

        var addURLButton = $("<button/>").text("Add")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-url-button")
            .attr("type","button")
            .bind("click",addURL);

        referencedBy_div.append(referencedBy);
        referencedBy_div.append(addURLButton);

        var urlcount = 1;

        function addURL() {
            var newURL = ($("<div/>")).addClass("referencedBy_div");
            var URL = $("<input/>")
                .attr("class","referencedBy")
                .attr("type","text")
                .attr("id","referencedBy-" + urlcount);

            var previousURL = $(".referencedBy_div").last();
            //detach from the previously last url input
            // so we can put it back on the new one
            addURLButton.detach();
            var deleteURL = $("<button/>").text("Remove")
                .addClass("btn btn-xs btn-default")
                .attr("id","remove-url-button")
                .attr("type","button")
                    .click(function() {
                        previousURL.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            previousURL.append(deleteURL);
            data_fields.append(newURL.append(URL).append(addURLButton));
            urlcount++;
            return [URL,newURL];
        }

        var licences_label = $("<label/>")
            .attr("for","licences")
            .text("Licences: ");

        //TODO: add licences fields

        var TOS_label = $("<label/>")
            .attr("for","TOS")
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
            .attr("for","citation")
            .text("Citations: ");

        var citations = $("<div/>");

        var citation_div = $("<div/>").addClass("citation_div");

        var citation = $("<input/>")
            .addClass("citation")
            .attr("name","data citation")
            .attr("id","citation-0");

        var addCitationButton = $("<button/>")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-citation-button")
            .attr("type","button")
            .bind("click",addCitation)
            .attr("aria-label","Add citation");

        addCitationButton.append($("<i>").addClass("fa fa-plus"));

        citation_div.append(citation);
        citation_div.append(addCitationButton);

        citations.append(citation_div);

        var citationCount = 1;

        function addCitation() {
            var newCitation_div = ($("<div/>")).addClass("citation_div");
            var newCitation = $("<input/>")
                .attr("class","citation")
                .attr("type","text")
                .attr("id","citation-" + citationCount);

            var previousCitation = $(".citation_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default remove-citation-button")
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
            .text("Copyright: ");

        var copyright = $("<textarea/>")
            .attr("id","copyright")
            .attr("name","copyright");

        var data_fields = $("<fieldset/>")
            .attr("title","data_fields").attr("id","data_fields")
            .append(abstract_label)
            .append(abstract)
            .append(referencedBy_label)
            .append(referencedBy_div)
            .append(licences_label)
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
                file_types: file_types};
    };

    var action = {
        help: "Upload associated data",
        help_index: "b",
        icon: "fa-upload",
        handler : upload_data_dialog,
    };

    var prefix = "linker_extension";
    var action_name = "upload-associated-data";

    var load = function () {
        Jupyter.actions.register(action,action_name,prefix);
        $("#upload_data").click(function () {
            upload_data_dialog();
        });
    };

    module.exports = {
        load: load, 
        upload_data_form: upload_data_form,
        upload_data: upload_data,
    };
});