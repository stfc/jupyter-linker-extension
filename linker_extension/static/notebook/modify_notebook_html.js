define([
    "base/js/namespace",
    "base/js/utils"
],function(Jupyter,utils){

    /*  
     *  Makes all the hacky changes to the notebook page.
     */ 
    var load = function() {
        var Promise = require("es6-promise").Promise;
        //make publish menu
        var dropdown = $("<li/>").addClass("dropdown publish-dropdown")
            .append($("<a/>")
                    .attr("href","#")
                    .addClass("dropdown-toggle")
                    .attr("data-toggle","dropdown")
                    .text("Publish"));

        dropdown.click(function () {
            // The selected cell loses focus when the menu is entered, so we
            // re-select it upon selection.
            var i = Jupyter.notebook.get_selected_index();
            Jupyter.notebook.select(i, false);
        });
        var dropdown_ul = $("<ul/>")
            .attr("id","publish_menu")
            .addClass("dropdown-menu");

        dropdown.append(dropdown_ul);
        $("ul.navbar-nav").append(dropdown);
        
        dropdown_ul.append($("<li/>").attr("id","add_metadata")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Add Metadata")))

                   .append($("<li/>").attr("id","sword_new_item")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("New SWORD item")))

                   .append($("<li/>").addClass("divider"))

                   .append($("<li/>").attr("id","select_data")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Select associated data")))

                   .append($("<li/>").attr("id","view_data")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("View associated data")))

                   .append($("<li/>").attr("id","upload_data")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Upload associated data")))
 
                   .append($("<li/>").addClass("divider"))

                   .append($("<li/>").attr("id","toggle_cell_references_bar")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Show/Hide cell references toolbar")))

                   .append($("<li/>").attr("id","generate_references")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Generate references")))

                   .append($("<li/>").addClass("divider"))

                   .append($("<li/>").attr("id","publish_notebook")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Publish Notebook")))

                   .append($("<li/>").attr("id","publish_bundle")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Publish associated data")))

                   .append($("<li/>").attr("id","publish_notebook_and_bundle")
                                     .append($("<a/>")
                                             .attr("href","#")
                                             .text("Publish Notebook and associated data")));

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
                "nbconvert",
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