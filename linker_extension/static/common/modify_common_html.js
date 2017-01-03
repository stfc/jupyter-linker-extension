define(['base/js/namespace','base/js/utils'],function(Jupyter,utils){

	var load = function() {
        var header_container = $('#header-container').detach();
        var header_container_container = $('<div/>').attr("id","header-container-container").addClass("container");
        header_container_container.append(header_container);
        $('#header').prepend(header_container_container);

        var file_tree_button = $('<a/>').addClass("btn btn-default btn-sm navbar-btn pull-right file-tree-button").css("margin-right","2px").css("margin-left","2px").attr("href",utils.get_body_data("baseUrl")).text("File Tree");
        $('#login_widget').after(file_tree_button);
        
    	$('#ipython_notebook').children("a").attr("href","https://www.stfc.ac.uk/");

        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', utils.get_body_data("baseUrl") + 'nbextensions/linker_extension/base/base_style.css')
        );
    };

    module.exports = {load: load};
});
