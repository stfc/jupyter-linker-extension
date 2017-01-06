define([
    "base/js/namespace",
    "base/js/utils"
],function(Jupyter,utils){

    var load = function() {
        var menubar_container = $("#menubar-container").detach();
        var menubar_container_container = $("<div/>")
                                          .attr("id","menubar-container-container")
                                          .addClass("container");
        menubar_container_container.append(menubar_container);
        $(".header-bar").after(menubar_container_container);

        //make publish menu
        var dropdown = $("<li/>").addClass("dropdown")
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

        var toggle_cell_references_bar_text = "";

        if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension") {
            toggle_cell_references_bar_text = "Show cell references toolbar";
        } else {
            toggle_cell_references_bar_text = "Hide cell references toolbar";
        }

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
                                             .text(toggle_cell_references_bar_text)))

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

        $("#download_pdf").remove();
        var new_pdf_menu_item = $("<li>").attr("id","#download_pdf")
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