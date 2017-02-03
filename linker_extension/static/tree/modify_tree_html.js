define([
    "base/js/namespace",
],function(){

    /*  
     *  html hacks for the tree page
     */ 

    var load = function() {
        //add a divider and our extra instructions
        $(".dynamic-buttons").after($("<hr/>").attr("id","bundle-divider"));
        var bundle_instructions = $("<div/>")
                                  .addClass("bundle-instructions")
                                  .text("Select files and directories to " + 
                                        "associate with your chosen notebook." +
                                        " Note: you cannot associate notebooks" +
                                        " with other notebooks.\n");
        $("#bundle-divider").after(bundle_instructions);

        //add our custom bundle and cancel buttons
        var bundle_buttons = $("<div/>").attr("id","bundle-buttons");

        var bundle_button = $("<button/>")
                            .addClass("bundle-button btn btn-default btn-xs")
                            .attr("title","Associated the selected files with "
                                  + sessionStorage.getItem("bundle"))
                            .text("Bundle");

        var cancel_button = $("<button/>")
                            .addClass("bundle-cancel-button btn btn-default btn-xs")
                            .attr("title","Stop associating files and return to the regular tree")
                            .text("Cancel");

        bundle_buttons.append(bundle_button).append(cancel_button);
        $(".bundle-instructions").after(bundle_buttons);

        //changed this to make more sense (hopefully) to users
        var upload_html = $(".btn-upload").html();
        upload_html = upload_html.replace("Upload","Add files to current directory");
        $(".btn-upload").html(upload_html);        

    };

    module.exports = {load: load}; 
});