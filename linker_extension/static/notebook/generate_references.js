define(['base/js/namespace','base/js/utils','../custom_utils','../custom_contents','./modify_notebook_html'],function(Jupyter,utils,custom_utils,custom_contents){

	var generate_references = function() {
		var cells = Jupyter.notebook.get_cells(); 

		var reference_urls = Object.create(null); //object can mimic set functionality - we only want one url to show up for a reference which may appear multiple times
												  //keys are the set items, values are just set to true.

		if("databundle_url" in Jupyter.notebook.metadata) {
			reference_urls[Jupyter.notebook.metadata.databundle_url] = true;
		}
		if("reportmetadata" in Jupyter.notebook.metadata) {
			Jupyter.notebook.metadata.reportmetadata.referencedBy.forEach(function(item) {
				reference_urls[item] = true;
			});
		}

		cells.forEach(function(cell) { //use loop to find our reference cell and if it's not our reference cell get the urls of it's indivudual references
		  	if (cell.metadata.reference_cell === true) {
				var cell_index = Jupyter.notebook.find_cell_index(cell);
				Jupyter.notebook.delete_cell(cell_index);
			}
			else {
				if("referenceURLs" in cell.metadata) {
					cell.metadata.referenceURLs.forEach(function(item) {
						reference_urls[item] = true;
					});
				}
			}
		});		

		if (Object.keys(reference_urls).length > 0) {
			var reference_cell = Jupyter.notebook.insert_cell_at_bottom("markdown");

			var text = "## References\n";

			Object.keys(reference_urls).forEach(function(reference,index) {
				text = text +"<" + reference + ">\n\n"; //markdown can use <link here> to generate links
			});

			reference_cell.set_text(text);
			reference_cell.execute();

			reference_cell.metadata.reference_cell = true; //can't use cell ids since they're regenerated on load so put a bool in the reference cell metadata which we can search for
		} else { //no references - show alert to user to tell them
			custom_utils.create_alert("alert-danger","Reference cell not generated since there are no references specified. " +
				"Specify references by adding them to the notebook metadata, using the cell reference toolbar to add references " +
				"to specific cells or by uploading a data bundle to DSpace from this notebook.");
		}
		
	};

	var action = {
        help: 'Generate references',
        help_index: 'f',
        handler : generate_references,
    };

    var prefix = "linker_extension";
    var action_name = "generate-references";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);
    
    var load = function () {
        $('#generate_references').click(function () {
            generate_references();
        });
    };

    module.exports = {load: load};
});