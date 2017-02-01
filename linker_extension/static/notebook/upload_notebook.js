define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_utils,custom_contents){

    /*  
     *  Actually upload the notebook. Requires a username & password, and if
     *  a licence file was uploaded will be passed a file name and contents.
     *  Stringifies all the metadata and other stuff needed by SWORDHandler
     *  and sends the request. If successful, shows an success notification
     *  that contains the url of the item uploaded. If it fails, will show
     *  an error notification with the error message and a notice to contact
     *  the devs. Also guards against there being no metadata, as it will also
     *  create an error notification.
     */ 
    var upload_notebook = function(
        username,
        password,
        licence_file_name,
        licence_file_contents
    ) {
        if ("reportmetadata" in Jupyter.notebook.metadata) {
            var stringauthors = [];
            var authors = Jupyter.notebook.metadata.reportmetadata.authors;
            authors.forEach(function(author) {
                var authorstring = author[0] + ", " + author[1];
                stringauthors.push(authorstring); 
            });

            var data = JSON.stringify({
                "username": username,
                "password": password,
                "licence_file_name":licence_file_name,
                "licence_file_contents": licence_file_contents,
                "notebookpath": Jupyter.notebook.notebook_path,
                "title":Jupyter.notebook.metadata.reportmetadata.title,
                "authors":stringauthors,
                "abstract":Jupyter.notebook.metadata.reportmetadata.abstract,
                "tags":Jupyter.notebook.metadata.reportmetadata.tags,
                "date":Jupyter.notebook.metadata.reportmetadata.date,
                "language":Jupyter.notebook.metadata.reportmetadata.language,
                "publisher":Jupyter.notebook.metadata.reportmetadata.publisher,
                "citations":Jupyter.notebook.metadata.reportmetadata.citations,
                "referencedBy":Jupyter.notebook.metadata.reportmetadata.referencedBy,
                "funders":Jupyter.notebook.metadata.reportmetadata.funders,
                "sponsors":Jupyter.notebook.metadata.reportmetadata.sponsors,
                "repository":Jupyter.notebook.metadata.reportmetadata.repository,
                "licence_preset":Jupyter.notebook.metadata.reportmetadata.licence.preset,
                "licence_url": Jupyter.notebook.metadata.reportmetadata.licence.url
            });
            custom_contents.sword_new_item(data).then(
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
                    custom_utils.create_alert("alert-success nb-upload-success-alert",
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
                //TODO: aim the error messages at the user and not me
            );
        } else {
            custom_utils.create_alert("alert-danger",
                                      "Error! No metadata found. Please use " +
                                      "the \"Add Metadata\" menu item to add " +
                                      "the metadata for this report");
        }
    };


    /*  
     *  Creates a dialog that prompts for username and password. Queries LDAP on
     *  whether the user is vlaid before bothering to send a request to DSpace.
     *  This is mostly here for testing purposes and will eventually be removed.
     */ 
    var upload_notebook_dialog = function() {
        var login = $("<table/>").attr("id","login-fields-new-item");
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

        var modal_obj = dialog.modal({
            title: "Upload Notebook",
            body: login,
            default_button: "Cancel",
            buttons: {
                Upload:  {
                    class : "btn-primary",
                    click: function() {
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
                                upload_notebook(
                                    username_field_val,
                                    password_field_val,
                                    "",
                                    ""
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
                },
                Cancel: {},
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.keyboard_manager,
        });

        modal_obj.on("shown.bs.modal", function () {
            //don't auto-dismiss when you click upload
            $(".modal-footer > .btn-primary").removeAttr("data-dismiss");
        });
    };

    /*  
     *  The below adds an action to the notebook and assigns the add_metadata
     *  function to the New Sword Item function, and handles exporting the
     *  functions we use in other modules/files.
     *  TODO: remove the new sword item button. Have this module exist to
     *  support Publish Notebook
     */ 
    
    var action = {
        help: "Upload notebook",
        help_index: "e",
        icon: "fa-upload",
        handler : upload_notebook,
    };

    var prefix = "linker_extension";
    var action_name = "upload-notebook-data";

    var load = function () {
        Jupyter.actions.register(action,action_name,prefix);
        $("#sword_new_item").click(function () {
            upload_notebook_dialog();
        });
    };

    module.exports = {load: load, upload_notebook: upload_notebook};
});