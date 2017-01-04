define(["base/js/namespace","base/js/utils"],function(Jupyter,utils){

    var load = function() {
        var header_containter = $("#header-container").detach();
        var header_containter_container = $("<div/>")
                                          .attr("id","header-container-container")
                                          .addClass("container");

        header_containter_container.append(header_containter);
        $("#header").prepend(header_containter_container);

        var file_tree_button = $("<a/>")
                               .addClass("btn btn-default btn-sm navbar-btn" 
                                         + "pull-right file-tree-button")
                               .css("margin-right","2px")
                               .css("margin-left","2px")
                               .attr("href",utils.get_body_data("baseUrl"))
                               .text("File Tree");

        $("#login_widget").after(file_tree_button);
        
        var logo_link = $("#ipython_notebook").children("a");
        logo_link.attr("href","https://www.stfc.ac.uk/");

        $("head").append(
            $("<link>")
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr("href", utils.get_body_data("baseUrl")
                          + "nbextensions/linker_extension/base/base_style.css")
        );
    };

    module.exports = {load: load};
});
