define(['base/js/namespace','base/js/utils','../custom_utils','../custom_contents','./modify_notebook_html'],function(Jupyter,utils,custom_utils,custom_contents){

	var generate_references = function() {
		var cells = Jupyter.notebook.get_cells(); 

		var cell_references = [];
		cells.forEach(function(cell) { //use loop to find our reference cell and if it's not our reference cell get the urls of it's indivudual references
		  	if (cell.metadata.reference_cell === true) {
				var cell_index = Jupyter.notebook.find_cell_index(cell);
				Jupyter.notebook.delete_cell(cell_index);
			}
			else {
				cell_references = cell_references.concat(cell.metadata.referenceURLs);
			}
		});


		var reference_urls = [];
		reference_urls.push(Jupyter.notebook.metadata.databundle_url);
		reference_urls = reference_urls.concat(Jupyter.notebook.metadata.reportmetadata.referencedBy);
		cell_references.forEach(function(item) { //cell_references is an array of arrays so iterate over it and concat to the main references array
			reference_urls = reference_urls.concat(item);
		});


		var reference_cell = Jupyter.notebook.insert_cell_at_bottom("markdown");

		var text = "## References\n";
		reference_urls.forEach(function(reference) {
			text = text +"<" + reference + ">\n\n"; //markdown can use <link here> to gneerate links
		});

		reference_cell.set_text(text);
		reference_cell.execute();

		reference_cell.metadata.reference_cell = true; //can't use cell ids since they're regenerated on load so put a bool in the reference cell metadata which we can search for
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