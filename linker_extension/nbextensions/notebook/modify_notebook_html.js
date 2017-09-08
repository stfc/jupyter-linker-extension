define([
    "base/js/namespace",
    "base/js/utils"
],function(Jupyter,utils){

    /*  
     *  Makes all the hacky changes to the notebook page.
     */ 
    var load = function() {
        var data_dropdown =  $("<div/>").addClass("dropdown btn-group").attr("id","data-menu");
        var data_button  = $("<button/>")
                      .addClass("btn btn-default dropdown-toggle")
                      .attr("type","button")
                      .attr("data-toggle","dropdown")
                      .attr("title", "Data")
                      .text("Data ");
        var data_caret = $("<span>").addClass("caret");
        data_button.append(data_caret);

        var data_dropdown_ul = $("<ul/>")
            .attr("id","data_menu")
            .addClass("dropdown-menu");

        data_dropdown.append(data_button).append(data_dropdown_ul);

        $(Jupyter.toolbar.selector).append(data_dropdown);
        
        function add_new_item(menu, display_text, id) {
        	menu.append($("<li/>").attr("id",id)
                                              .append($("<a/>")
                                                      .attr("href","#")
                                                      .text(display_text)));
        }
        
        function add_divider(menu) {
        	menu.append($("<li/>").addClass("divider"));
        }
        
        //Create data toolboar
        add_new_item(data_dropdown_ul, "Add Cell References", "cell_references_bar");
        add_new_item(data_dropdown_ul, "Generate References", "generate_references");
        add_divider(data_dropdown_ul);
        add_new_item(data_dropdown_ul, "Insert Dataplot Cell", "insert_dataplot_cell");
        add_new_item(data_dropdown_ul, "Insert Analysis Cell", "insert_analysis_cell");
        add_new_item(data_dropdown_ul, "Edit Current Cell", "edit_current_cell");
        add_divider(data_dropdown_ul);
        add_new_item(data_dropdown_ul, "Manage Metadata", "manage_metadata");
        add_new_item(data_dropdown_ul, "Manage Associated Data", "manage_associated_data");
        add_divider(data_dropdown_ul);
        add_new_item(data_dropdown_ul, "Import Data", "download_data");
        add_divider(data_dropdown_ul);
        add_new_item(data_dropdown_ul, "Publish to eData", "publish");

        //Extend insert menu
        var insert_menu = $("#insert_menu");
        add_divider(insert_menu);
        add_new_item(insert_menu, "Insert Dataplot Cell", "insert_dataplot_cell_insert");
        add_new_item(insert_menu, "Insert Analysis Cell", "insert_analysis_cell_insert");
        
        //Extend cell menu
        var cell_menu = $("#cell_menu");
        add_divider(cell_menu);
        add_new_item(cell_menu, "Add Cell References", "cell_references_cell_menu");
        
        //Extend edit menu
        var manage_metadata = $("<li/>").attr("id","manage_metadata_edit").append($("<a/>")
                .attr("href","#")
                .text("Manage Metadata"));
        var manage_associated = $("<li/>").attr("id","manage_associated_data_edit").append($("<a/>")
                .attr("href","#")
                .text("Manage Associated Data"));
        $("#edit_nb_metadata").after(manage_associated);  
        $("#edit_nb_metadata").after(manage_metadata);       
        
        /*  
         *  The notebook metadata doesn't exist immediately and we need it to
         *  determine whether the toggle cell toolbar button needs to say show or
         *  hide. So we use a promise to poll the metadata every second until it
         *  exists, and then we can check whether to say show or hide
         */ 
        var promise = new Promise(function(resolve) {
            function poll() {
                if(Jupyter.notebook.metadata) {
                    resolve();
                } else {
                    setTimeout(poll,1000);
                } 
            }
            poll();
        });

        promise.then(function() {
            if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension") {
                $("#toggle_cell_references_bar > a").text("Show cell references toolbar");
            } else {
                $("#toggle_cell_references_bar > a").text("Hide cell references toolbar");
            }
        });

        /*  
         *  We want to use our custom template to download via PDF, so this stuff
         *  is literally just replacing the button but specifying our custom
         *  template rather than the default. This code is pretty much lifted from
         *  the notebook's code.
         */ 
        $("#download_pdf").remove();
        var new_pdf_menu_item = $("<li>")
            .attr("id","#download_pdf")
            .append($("<a/>")
                    .attr("href","#")
                    .text("PDF via LaTeX (.pdf)"));

        new_pdf_menu_item.click(function() {
            var notebook_path = utils.encode_uri_components(Jupyter.notebook.notebook_path);
            var url = utils.url_path_join(
                Jupyter.notebook.base_url,
                "customnbconvert",
                "pdf",
                "custom_article",
                notebook_path
            ) + "?download=true";
            
            var w = window.open("", Jupyter._target);
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