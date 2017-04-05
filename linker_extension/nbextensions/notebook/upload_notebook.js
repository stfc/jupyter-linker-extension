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
    var upload_notebook = function(data) {
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
    };

    module.exports = {upload_notebook: upload_notebook};
});