define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./add_metadata",
    "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_utils,custom_contents,add_metadata){

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
    var upload_notebook = function(data) {
        custom_contents.sword_new_item(JSON.stringify(data)).then(
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
    };


    /*  
     *  Creates a dialog that prompts for username and password. Queries LDAP on
     *  whether the user is valid before bothering to send a request to DSpace.
     *  This is mostly here for testing purposes and will eventually be removed.
     */ 
    var upload_notebook_dialog = function() {
        var config_username = "";

        var login = $("<table/>").attr("id","login-fields-new-item");
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

        var modal_obj = dialog.modal({
            title: "Upload Notebook",
            body: login,
            default_button: "Cancel",
            buttons: {
                Upload:  {
                    class : "btn-primary",
                    click: function() {
                        if("reportmetadata" in Jupyter.notebook.metadata) {
                            $(".login-error").remove();
                            var username_field_val = $("#username").val();
                            var password_field_val = $("#password").val();

                            var login_details = JSON.stringify({
                                username: username_field_val,
                                password: password_field_val
                            });

                            var request = custom_contents.ldap_auth(login_details);

                            request.then(function() { //success function
                                var data = add_metadata.get_values_from_metadata();
                                data.username = username_field_val;
                                data.password = password_field_val;
                                data.notebookpath = Jupyter.notebook.notebook_path;
                                upload_notebook(data);

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
                            }).catch(function(reason) { //fail function
                                var error = $("<div/>")
                                    .addClass("login-error")
                                    .css("color","red");

                                error.text(reason.message);
                                login.after(error);
                            });
                        } else {
                            custom_utils.create_alert(
                                "alert-danger",
                                "Error! No metadata found. Please use " +
                                "the \"Add Metadata\" menu item to add " +
                                "the metadata for this report");
                        }
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