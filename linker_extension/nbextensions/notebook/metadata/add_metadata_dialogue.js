define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents",
        "./add_metadata_input_fields"
],function(Jupyter,utils,dialog,custom_contents,input_fields){

    /*  
     *  Creates the modal that pops up when "Add Metadata" is clicked.
     *  It uses the dialog module from the main notebook to create a dialog.
     *  It creates the form body by running create_fields(), and adds some
     *  labelling fluff. it also defines previous and next butttons and 
     *  assigns the logic to these buttons that tells them when to change page,
     *  which is done via toggling visibility using a class "hide-me" and also
     *  calls the validator functions and uses them to dictate when a page is 
     *  allowed to change. Also finally calls save metadata before the modal is
     *  dismissed.
     */ 
    var add_metadata = function() {
        var form_fields = input_fields.create_forms();

        var form_body = $("<form/>").attr("id","add_metadata_form")
                                    .append($("<label/>")
                                            .attr("for","add_metadata_form")
                                            .text("Add the metadata for the notebook."))
                                    .append(form_fields.form1)
                                    .append(form_fields.form2);
        
        var modal = dialog.modal({
            title: "Add " + Jupyter.notebook.notebook_name + " Metadata",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        $("#fields2").addClass("hide-me");
                        $("#fields1").removeClass("hide-me");
                        $("#next").text("Next"); 
                        $("#previous").prop("disabled",true);
                        
                        return false;
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if($("#next").text() === "Next") {
                            input_fields.validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields1").addClass("hide-me");
                                $("#fields2").removeClass("hide-me");
                                $("#previous").prop("disabled",false);

                                //we want button text to be save on the last page
                                $("#next").text("Save");
                            }
                            return false;
                        } else { //save our metadata
                            input_fields.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                input_fields.save_metadata();
//                            	get_values_from_fields().then(function(result) {
//                                    Jupyter.notebook.metadata.reportmetadata = result;
//                                    Jupyter.notebook.save_notebook();
//                                });
                            } else {
                                return false;
                            }
                        }
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        //stuff to be done once the modal is loaded and shown
        modal.on("shown.bs.modal", function () {
            //disable previous button on first page, and add ids to the next
            //and previous buttons to make life easier
            $(".modal-footer > button.btn-sm").eq(1).attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).attr("id","next");

//            //we can't store licence file info in metadata so disable it
//            //only allow the option when publishing
//            $("#licence-file-radio").prop("disabled",true);
//            $("#licence-file").prop("disabled",true);
//            $("#licence-file-button").attr("disabled","disabled");
//
//            //need to move the autocomplete widgets since they were generated
//            //before the modal had fully loaded
//            $(".author-first-name").each(function(index,item) {
//                var full_id = $(item).attr("id");
//                var id = full_id.split("-").pop(); //get the number at the end of the id
//                $("#author-first-name-" + id).autocomplete("option","appendTo","#author-" + id);
//            });
//            $(".author-last-name").each(function(index,item) {
//                var full_id = $(item).attr("id");
//                var id = full_id.split("-").pop(); //get the number at the end of the id
//                $("#author-last-name-" + id).autocomplete("option","appendTo","#author-" + id);
//            });
        });
    };

    var action = {
        help: "Add notebook metadata",
        help_index: "a",
        icon: "fa-bars",
        handler : add_metadata,
    };

    var prefix = "linker_extension";
    var action_name = "add-notebook-metadata";

    var load = function () {
        Jupyter.notebook.keyboard_manager.actions.register(action,action_name,prefix);
        $("#add_metadata").click(function () {
            add_metadata();
        });
    };

    module.exports = {
        load: load,
        add_metadata: add_metadata,
    };
});