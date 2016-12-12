define(['base/js/namespace','base/js/utils','base/js/dialog','../custom_utils','../custom_contents','./modify_notebook_html'],function(Jupyter,utils,dialog,custom_utils,custom_contents){

    var upload_notebook = function(username) {
        if ("reportmetadata" in Jupyter.notebook.metadata) {
                var stringauthors = [];
                var authors = Jupyter.notebook.metadata.reportmetadata.authors;
                authors.forEach(function(author) {
                    var authorstring = author[0] + ", " + author[1];
                    stringauthors.push(authorstring); 
                });

                var options = {
                    "username": username,
                    "notebookpath": Jupyter.notebook.notebook_path,
                    "title":Jupyter.notebook.metadata.reportmetadata.title,
                    "authors":stringauthors,
                    "abstract":Jupyter.notebook.metadata.reportmetadata.abstract,
                    "tags":Jupyter.notebook.metadata.reportmetadata.tags,
                    "date":Jupyter.notebook.metadata.reportmetadata.date,
                    "language":Jupyter.notebook.metadata.reportmetadata.language,
                    "publisher":Jupyter.notebook.metadata.reportmetadata.publisher,
                    "citation":Jupyter.notebook.metadata.reportmetadata.citation,
                    "referencedBy":Jupyter.notebook.metadata.reportmetadata.referencedBy,
                    "funders":Jupyter.notebook.metadata.reportmetadata.funders,
                    "sponsors":Jupyter.notebook.metadata.reportmetadata.sponsors,
                    "repository":Jupyter.notebook.metadata.reportmetadata.repository
                };
                custom_contents.sword_new_item(options).catch(function(reason) {
                    //I feel dirty, but I can't get Jupyter to not assume the success response is an error
                    //so if the error response has the code 201, post a "success" notification instead
                    //TODO: actually make Jupyter recognise that it's not an error? Is it worth it?
                    var id = "";
                    var xml_str = "";
                    if (reason.xhr.status === 201) {
                        xml_str = reason.xhr.responseText.split("\n");
                        xml_str.forEach(function(item) {
                            if (item.indexOf("<atom:id>") !== -1) { // -1 means it's not in the string
                                var endtag = item.lastIndexOf("<");
                                var without_endtag = item.slice(0,endtag);
                                var starttag = without_endtag.indexOf(">");
                                var without_starttag = without_endtag.slice(starttag + 1);
                                id = without_starttag;
                            }
                        });
                        custom_utils.create_alert("alert-success","Success! Item created in DSpace via SWORD!").attr('item-id',id);
                    } else if (reason.xhr.status === 202) {
                        xml_str = reason.xhr.responseText.split("\n");
                        xml_str.forEach(function(item) {
                            if (item.indexOf("<atom:id>") !== -1) { // -1 means it's not in the string
                                var endtag = item.lastIndexOf("<");
                                var without_endtag = item.slice(0,endtag);
                                var starttag = without_endtag.indexOf(">");
                                var without_starttag = without_endtag.slice(starttag + 1);
                                id = without_starttag;
                            }
                        });
                        custom_utils.create_alert("alert-warning","Item submitted to DSpace but it needs to be approved by an administrator").attr('item-id',id);
                    } else {
                        custom_utils.create_alert("alert-danger","Error! " + reason.message + ", please try again. If it continues to fail please contact the developers.");
                    }
                    //TODO: aim the error messages at the user and not me
                });
            } else {
                custom_utils.create_alert("alert-danger","Error! No metadata found. Please use the 'Add Metadata' menu item to add the metadata for this report");
            }
    };
    
    var action = {
        help: 'Upload notebook',
        help_index: 'e',
        icon: 'fa-upload',
        handler : upload_notebook,
    };

    var prefix = "linker_extension";
    var action_name = "upload-notebook-data";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);

    var load = function () {
        $('#sword_new_item').click(function () {
            upload_notebook("mnf98541"); //todo: username storage? or we can probably get rid of this button
        });
    };

    module.exports = {load: load, upload_notebook: upload_notebook};
});