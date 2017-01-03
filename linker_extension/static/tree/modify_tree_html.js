define(['base/js/namespace','../custom_utils'],function(Jupyter,custom_utils){

	var load = function() {
        /*//applies to all pages - need to repeat for notebook and edit
        var header_container = $('#header-container').detach();
        var header_container_container = $('<div/>').attr("id","header-container-container").addClass("container");
        header_container_container.append(header_container);
        $('#header').prepend(header_container_container);

        var file_tree_button = $('<a/>').addClass("btn btn-default btn-sm navbar-btn pull-right file-tree-button").css("margin-right","2px").css("margin-left","2px").attr("href",utils.get_body_data("baseUrl")).text("File Tree");
        $('#login_widget').after(file_tree_button);
        
    	$('#ipython_notebook').children("a").attr("href","https://www.stfc.ac.uk/");

        //tree page specific modifications
        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', utils.get_body_data("baseUrl") + 'nbextensions/linker_extension/tree/tree_style.css')
        );*/

        var bundle_instructions = $("<div/>").addClass("bundle-instructions").text("Select files and directories to associate with your chosen notebook. Note: you cannot associate notebooks with other notebooks.\n");
        $('.dynamic-instructions').after(bundle_instructions);

        var bundle_button = $('<button/>').addClass("bundle-button btn btn-default btn-xs").attr("title","Associated the selected files with " + sessionStorage.getItem("bundle")).text("Bundle");
        var cancel_button = $('<button/>').addClass("bundle-cancel-button btn btn-default btn-xs").attr("title","Stop associating files and return to the regular tree").text("Cancel");
        $('.dynamic-buttons').prepend(cancel_button).prepend(bundle_button);
    };

    module.exports = {load: load}; 
});