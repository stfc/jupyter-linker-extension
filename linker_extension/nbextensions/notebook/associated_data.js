define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "./local_data"
],function(Jupyter,utils,dialog,local_data){
	var md = Jupyter.notebook.metadata.reportmetadata;
    var manage_associated_data = function() {
		var modal = dialog.modal({
            title: "Manage datafiles associated with this notebook",
            body: local_data.data_form("associated"),
            buttons: {
                Cancel: {},
                Select: { 
                    class : "btn-primary",
                    id: "select",
                    click: function() {
                    	local_data.reset_associated_data("associated");
                    	return true;
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        //stuff to do on modal load
        modal.on("shown.bs.modal", function () {
        	console.log("Managing associated data");
        	md = Jupyter.notebook.metadata.reportmetadata;
        	if (!md.hasOwnProperty("files")) {
        		md.files = [];
        	}
        	
            local_data.init_data_form(md.files, "associated");
        });
    };
               
    //Register the action with Jupyter.
    var action = {
        help: "Manage local data associated with this notebook",
        help_index: "a",
        icon: "fa-download",
        handler : manage_associated_data,
    };

    var prefix = "linker_extension";
    var action_name = "manage-associated-data";

    var load = function () {
        Jupyter.notebook.keyboard_manager.actions.register(action,action_name,prefix);
        $("#manage_associated_data").click(function () {
            manage_associated_data();
        });
    };

    module.exports = {
        load: load,
    };
});