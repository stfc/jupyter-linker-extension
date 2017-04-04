define(["base/js/namespace","base/js/utils"],function(Jupyter,utils){

    /*  
     *  all the common html hacks
     */ 
    var load = function() {
        //add an extra div to the header, purely so we can colour in the whole
        //header but still have the logos and buttons and stuff still align
        //with the notebook
        var header_containter = $("#header-container").detach();
        var header_containter_container = $("<div/>")
            .attr("id","header-container-container")
            .addClass("container");

        header_containter_container.append(header_containter);
        $("#header").prepend(header_containter_container);

        //since clicking the logo goes to stfc website, need a button to take
        //the user back to the file tree
        var file_tree_button = $("<a/>")
            .attr("id","file-tree-button")
            .addClass("btn btn-default btn-sm navbar-btn " + 
                     "pull-right")
            .css("margin-right","2px")
            .css("margin-left","2px")
            .attr("href",utils.get_body_data("baseUrl"))
            .text("File Tree");

        $("#login_widget").after(file_tree_button);
        
        //change the logo link, logo and the favicon to stfc stuff
        var logo_link = $("#ipython_notebook").children("a");
        logo_link.attr("href","https://www.stfc.ac.uk/");
        var logo = $("#ipython_notebook").children("a").children("img");
        logo.attr("src", utils.get_body_data("baseUrl") + 
                         "nbextensions/linker_extension/common/logo.png");

        //add our custom css
        $("head").append(
            $("<link>")
            .attr("rel", "stylesheet")
            .attr("type", "text/css")
            .attr("href", utils.get_body_data("baseUrl")
                          + "nbextensions/linker_extension/common/common_style.css")
        );



        document.head = document.head || document.getElementsByTagName("head")[0];

        var src = utils.get_body_data("baseUrl") +  "nbextensions/linker_extension/common/favicon.ico";
        var link = document.createElement("link");
        var oldLink = document.querySelector("link[rel=\"shortcut icon\"]");
        link.rel = "shortcut icon";
        link.type = "image/x-icon";
        link.href = src;
        if (oldLink) {
            document.head.removeChild(oldLink);
        }
        document.head.appendChild(link);

        //applies to both notebook and edit - put it here so we don't have
        //to add additional code just for the edit page
        if($("#menubar-container")) {
            //add extra container to menu bar for similar reasons to 
            //header
            var menubar_container = $("#menubar-container").detach();
            var menubar_container_container = $("<div/>")
                .attr("id","menubar-container-container")
                .addClass("container");
            menubar_container_container.append(menubar_container);
            $(".header-bar").after(menubar_container_container);
        }
        
    };

    module.exports = {load: load};
});
