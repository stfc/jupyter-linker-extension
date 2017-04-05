define([
    "base/js/namespace",
    "base/js/utils",
    "base/js/dialog",
    "../custom_utils",
    "../custom_contents",
    "./modify_notebook_html",
],function(
    Jupyter,
    utils,
    dialog,
    custom_utils,
    custom_contents) {

    /*  
     *  Extract the values from the form fields and return a promise that will
     *  have all the values in a single object once it is resolved.
     *  This is needed so we can wait for file upload to complete.
     */ 
    var get_values_from_fields = function() {
        var files = $("#file-select").val();

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
                var file = TOS_files[i];
                var promise = new Promise(function(resolve,reject) {
                    var reader = new FileReader();

                    reader.onload = function(e) {
                        var file_info = {};
                        file_info["file_name"] = file.name;
                        file_info["file_mimetype"] = file.type;
                        file_info["file_contents"] = e.target.result;
                        TOS_files_contents.push(file_info);
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
        else if ("reportmetadata" in md) {                    
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
        }
    };

    /*  
     *  Validates data files. Clears errors when run and adds
     *  errors above the file selector
     */ 
    var validate_files = function() {
        $(".data-form-error").remove();

        if($("#file-select").val() === null) {
            var files_error = $("<div/>")
                .attr("id","data-files-missing-error")
                .addClass("data-form-error")
                .text("Please select at least one file");

            $("#files-page").prepend(files_error);
        }

        $(".data-form-error").css("color", "red");
    };

    /*  
     *  Validates fields for the data metadata. Clears errors when run and adds
     *  errors beneath the labels of the relevant fields
     */ 
    var validate_metadata = function() {
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
        var files_page = $("<fieldset/>").attr("id","files-page");
        var metadata_page = $("<fieldset/>").addClass("hide-me").attr("id","metadata-page");

        var file_select = $("<select/>")
            .attr("id","file-select")
            .attr("multiple","multiple");

        var notebook_path = Jupyter.notebook.notebook_path;
        var base_path_split = notebook_path.split("/");
        base_path_split.pop(); //pop removes last element of array - removes file name
        var base_path = base_path_split.join("/");
        var contents = Jupyter.notebook.contents;

        var all_files = [];
        var find_children = function(paths) {
            //expand any directories and add them to the list
            var recursive_promises = [];
            paths.forEach(function(item) {
                if(item.type === "directory") {
                    var promise = contents.list_contents(item.path).then(function(response) {
                        return find_children(response.content);
                    });
                    recursive_promises.push(promise);
                } else {
                    all_files.push(item);
                }
            });
            //wait for the recursive promises to come back
            return Promise.all(recursive_promises);
        };

        contents.list_contents(base_path).then(function(response) {
            return find_children(response.content);
        }).then(function() {
            all_files.forEach(function(item) {
                var base_index = item.path.indexOf(base_path);
                if(base_index === 0) { //should be the only case
                    var rel_path = item.path.slice(base_path.length);
                    if(rel_path.charAt(0) === "/") { //get rid of leading slash
                        rel_path = rel_path.slice(1);
                    }
                    var rel_path_split = rel_path.split("/");
                    var filename = rel_path_split.pop(); //pop removes last element of array - removes file name
                    var rel_base_path = rel_path_split.join("/");

                    var option = $("<option/>")
                        .attr("value",rel_path + ";" + item.mimetype)
                        .attr("data-section",rel_base_path)
                        .text(filename);

                    file_select.append(option);
                } else{
                    //TODO: test and see if we ever get this
                    console.log("base_path wasn't at start of string???");
                }
            });
        }).then(function() {
            var options = {
                sortable: true,
                searchable: true,
                startCollapsed: true,
                onChange: function(allSelectedItems) {
                    var default_abstract = "";
                    allSelectedItems.forEach(function(item) {
                        default_abstract = default_abstract + item.text + "\n\n";
                    });
                    $("#data-abstract").val(default_abstract);
                }
            };
            file_select.treeMultiselect(options);
        });

        files_page.append(file_select);

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
            .append($("<option/>").attr("value","CC BY").text("CC BY (Default)"))
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

        licenceDropdown.val("CC BY");

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
        upload_data: upload_data,
        upload_data_form: upload_data_form,
        get_values_from_fields: get_values_from_fields,
        validate_metadata: validate_metadata,
        validate_files: validate_files,
    };
});