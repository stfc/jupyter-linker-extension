define([
    "base/js/namespace",
],function(){

    var load = function() {
        var bundle_instructions = $("<div/>")
                                  .addClass("bundle-instructions")
                                  .text("Select files and directories to " + 
                                        "associate with your chosen notebook." +
                                        " Note: you cannot associate notebooks" +
                                        " with other notebooks.\n");
        $(".dynamic-instructions").after(bundle_instructions);

        var bundle_button = $("<button/>")
                            .addClass("bundle-button btn btn-default btn-xs")
                            .attr("title","Associated the selected files with "
                                  + sessionStorage.getItem("bundle"))
                            .text("Bundle");

        var cancel_button = $("<button/>")
                            .addClass("bundle-cancel-button btn btn-default btn-xs")
                            .attr("title","Stop associating files and return to the regular tree")
                            .text("Cancel");

        $(".dynamic-buttons").prepend(cancel_button).prepend(bundle_button);
    };

    module.exports = {load: load}; 
});