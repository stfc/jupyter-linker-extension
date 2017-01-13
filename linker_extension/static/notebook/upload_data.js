define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./view_data_dialog",
    "./select_data_notebook",
    "./modify_notebook_html"
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents,
    view_data,
    select_data) {

    var upload_data_dialog = function () {
        var upload_data_info = upload_data_form();

        var dialog_body = upload_data_info.dialog_body;

        var login_fields = $("<div/>").attr("id","login-fields-upload-data");
        var username_label = $("<label/>")
            .attr("for","username")
            .text("Username: ");
        var username_field = $("<input/>").attr("id","username-upload-data");

        var password_label = $("<label/>")
            .attr("for","password")
            .text("Password: ");
        var password_field = $("<input/>")
            .attr("id","password-upload-data")
            .attr("type","password");

        login_fields.append(username_label)
                    .append(username_field)
                    .append(password_label)
                    .append(password_field);

        dialog_body.append(login_fields);

        var modal_obj = dialog.modal({
            title: "Upload Associated Data",
            body: dialog_body,
            default_button: "Cancel",
            buttons: {
                Cancel: {},
                Upload: { 
                    class : "btn-primary",
                    click: function() { //todo: remove this button or sort out username
                        upload_data(
                            $("#username-upload-data").val(),
                            $("#password-upload-data").val(),
                            upload_data_info.file_names,
                            upload_data_info.file_paths,
                            upload_data_info.file_types
                        );
                    }
                },
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.keyboard_manager,
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
            $(".data_referencedBy").each(function(i,e) {
                if($(e).val() !== "") {
                    referencedBy_URLs.push($(e).val());
                }
            });

            var data = JSON.stringify({
                "username": username,
                "password": password,
                "notebookpath": Jupyter.notebook.notebook_path,
                "file_names": file_names,
                "file_paths": file_paths,
                "file_types": file_types,
                "abstract": $("#data_abstract").val(),
                "referencedBy": referencedBy_URLs,
                "title":md.reportmetadata.title,
                "authors":stringauthors,
                "tags":md.reportmetadata.tags,
                "date":md.reportmetadata.date,
                "language":md.reportmetadata.language,
                "publisher":md.reportmetadata.publisher,
                "citations":md.reportmetadata.citations,
                "funders":md.reportmetadata.funders,
                "sponsors":md.reportmetadata.sponsors,
                "repository":md.reportmetadata.repository,
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
    

    var upload_data_form = function() {
        var display_files = $("<div/>").append(
            $("<p/>").addClass("bundle-message")
                .text("These are the files currently associated with " + 
                      Jupyter.notebook.notebook_name + " :")
        ).append(
            $("<br/>")
        );

        var view_data_info = view_data.view_data();

        display_files.append(view_data_info.view_data_div);

        var select_data_button = $("<button/>")
            .addClass("btn btn-xs btn-default select-data-button")
            .attr("type","button")
            .text("Select data")
            .attr("title","Select data to associate with this notebook")
            .attr("aria-label","Select data to associate with this notebook")
            .click(function() {
                select_data.select_data();
            });

        var file_names = view_data_info.file_names;
        var file_paths = view_data_info.file_paths;
        var file_types = view_data_info.file_types;

        var data_abstract_label = $("<label/>")
            .attr("for","data_abstract")
            .text("Please write an abstract here (You may want to write " +
                  " something to describe each file in the bundle): ");

        var data_abstract = $("<textarea/>")
            .attr("name","data_abstract")
            .attr("id","data_abstract");

        var default_abstract = "";
        file_names.forEach(function(item,index) {
            if(file_types[index] === "file") {
                default_abstract = default_abstract + item;
                if(index < file_names.length -1) {
                    default_abstract = default_abstract + "\n\n";
                }
            }
        });

        data_abstract.val(default_abstract);

        var data_referencedBy_label = $("<label/>")
            .attr("for","data_referencedBy")
            .text("Related publication persistent URLs: ");

        var data_referencedBy = $("<input/>")
            .addClass("data_referencedBy")
            .attr("name","data_referencedBy")
            .attr("id","data_referencedBy-0");

        var data_referencedBy_div = $("<div/>")
            .addClass("data_referencedBy_div");

        var addURLButton = $("<button/>").text("Add")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-url-button")
            .attr("type","button")
            .bind("click",addURL);

        data_referencedBy_div.append(data_referencedBy);
        data_referencedBy_div.append(addURLButton);

        var urlcount = 1;

        function addURL() {
            var newURL = ($("<div/>")).addClass("data_referencedBy_div");
            var URL = $("<input/>")
                .attr("class","data_referencedBy")
                .attr("type","text")
                .attr("id","data_referencedBy-" + urlcount);

            var previousURL = $(".data_referencedBy_div").last();
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

        var data_licences_label = $("<label/>")
            .attr("for","data-licences")
            .text("Licences: ");

        //TODO: add licences fields

        var data_TOS_label = $("<label/>")
            .attr("for","data-TOS")
            .text("Terms of Service: ");

        //TODO: add TOS fields

        var data_citationss_label = $("<label/>")
            .attr("for","data-citationss")
            .text("Third party citationss: ");

        //TODO: add citationss fields

        var data_copyright_label = $("<label/>")
            .attr("for","data-copyright")
            .text("Licences: ");

        var data_fields = $("<fieldset/>")
            .attr("title","data_fields").attr("id","data_fields")
            .append(data_abstract_label)
            .append(data_abstract)
            .append(data_referencedBy_label)
            .append(data_referencedBy_div)
            .append(data_licences_label)
            .append(data_TOS_label)
            .append(data_citationss_label)
            .append(data_copyright_label);

        var dialog_body = $("<div/>")
            .append(display_files)
            .append(select_data_button)
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