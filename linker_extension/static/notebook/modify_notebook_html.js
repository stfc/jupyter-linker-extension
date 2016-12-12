define(['base/js/namespace','base/js/utils'],function(Jupyter,utils){

	var load = function() {
        //applies to all pages - need to repeat for tree and edit
        console.log('Modify notebook html loaded');
        var header_container = $('#header-container').detach();
        var header_container_container = $('<div/>').attr("id","header-container-container").addClass("container");
        header_container_container.append(header_container);
        $('#header').prepend(header_container_container);

        var file_tree_button = $('<a/>').addClass("btn btn-default btn-sm navbar-btn pull-right").css("margin-right","2px").css("margin-left","2px").attr("href",Jupyter.notebook.base_url).text("File Tree");
        $('#login_widget').after(file_tree_button);
        
    	$('#ipython_notebook').children("a").attr("href","https://www.stfc.ac.uk/");

        //notebook page specific modifications
        $('head').append(
            $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', Jupyter.notebook.base_url + 'nbextensions/linker_extension/notebook/notebook_style.css')
        );

        var menubar_container = $('#menubar-container').detach();
        var menubar_container_container = $('<div/>').attr("id","menubar-container-container").addClass("container");
        menubar_container_container.append(menubar_container);
        $('.header-bar').after(menubar_container_container);

        //make publish menu
        var dropdown = $("<li/>").addClass("dropdown").append($("<a/>").attr("href","#").addClass("dropdown-toggle").attr("data-toggle","dropdown").text("Publish"));
        dropdown.click(function (event, ui) {
                // The selected cell loses focus when the menu is entered, so we
                // re-select it upon selection.
                var i = Jupyter.notebook.get_selected_index();
                Jupyter.notebook.select(i, false);
        });
        var dropdown_ul = $('<ul/>').attr("id","publish_menu").addClass("dropdown-menu");
        dropdown.append(dropdown_ul);
        $('ul.navbar-nav').append(dropdown);

        dropdown_ul.append($("<li/>").attr("id","add_metadata").append($("<a/>").attr("href","#").text("Add Metadata")))
        		   .append($("<li/>").attr("id","dspace_new_item").append($("<a/>").attr("href","#").text("New DSpace item")))
        		   .append($("<li/>").attr("id","sword_new_item").append($("<a/>").attr("href","#").text("New SWORD item")))
        		   .append($("<li/>").addClass("divider"))
        	   	   .append($("<li/>").attr("id","select_data").append($("<a/>").attr("href","#").text("Select associated data")))
        		   .append($("<li/>").attr("id","view_data").append($("<a/>").attr("href","#").text("View associated data")))
        		   .append($("<li/>").attr("id","upload_data").append($("<a/>").attr("href","#").text("Upload associated data")))
                   .append($("<li/>").addClass("divider"))
                   .append($("<li/>").attr("id","publish_notebook").append($("<a/>").attr("href","#").text("Publish Notebook")))
                   .append($("<li/>").attr("id","publish_bundle").append($("<a/>").attr("href","#").text("Publish associated data")))
                   .append($("<li/>").attr("id","publish_notebook_and_bundle").append($("<a/>").attr("href","#").text("Publish Notebook and associated data")));

        $("#download_pdf").remove();
        var new_pdf_menu_item = $("<li>").attr("id","#download_pdf").append($("<a/>").attr("href","#").text("PDF via LaTeX (.pdf)"));

        new_pdf_menu_item.click(function() {
            var notebook_path = utils.encode_uri_components(Jupyter.notebook.notebook_path);
            var url = utils.url_path_join(
                Jupyter.notebook.base_url,
                'nbconvert',
                'pdf',
                "custom_article",
                notebook_path
            ) + "?download=true";
            
            var w = window.open('', Jupyter._target);
            if (Jupyter.notebook.dirty && Jupyter.notebook.writable) {
                Jupyter.notebook.save_notebook().then(function() {
                    w.location = url;
                });
            } else {
                w.location = url;
            }
        });

        $("#download_rst").after(new_pdf_menu_item);
    };

    module.exports = {load: load};
});