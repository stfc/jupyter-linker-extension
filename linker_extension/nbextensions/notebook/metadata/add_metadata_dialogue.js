define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents",
        "./add_metadata_input_fields"
],function(Jupyter,utils,dialog,custom_contents,input_fields){

    /*  
     *  Creates the modal that pops up when "Add Metadata" is clicked.
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
            title: "Notebook metadata",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        $("#md_fields2").addClass("hide-me");
                        $("#md_fields1").removeClass("hide-me");
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
                                $("#md_fields1").addClass("hide-me");
                                $("#md_fields2").removeClass("hide-me");
                                $("#previous").prop("disabled",false);

                                //we want button text to be save on the last page
                                $("#next").text("Save");
                            }
                            return false;
                        } else { //save our metadata
                            input_fields.validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                input_fields.save_metadata();
                            	Jupyter.notebook.save_notebook();
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
        $("#manage_metadata").click(function () {
            add_metadata();
        })
        $("#manage_metadata_edit").click(function () {
            add_metadata();
        });;
    };

    module.exports = {
        load: load,
        add_metadata: add_metadata,
    };
});