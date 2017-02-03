define([], function(){
    "use strict";


    /*  
     *  defines some common functions that are used all over in my code
     */ 

    //creates an alert, takes in a message and a class name to add to the
    //alert class (this is so we can change the colour of the alert)
    var create_alert = function(alert_type, message) {
        var alert = $("<div/>")
                            .addClass("alert alert-dismissible fade in")
                            .addClass(alert_type)
                            .attr("role","alert")
                            .html(message)
                            .append(
                                $("<button/>")
                                .addClass("close")
                                .attr("type","button")
                                .attr("data-dismiss","alert")
                                .attr("aria-label","Close")
                                .append($("<span/>").attr("aria-hidden","true")
                                        .html("&times;")
                                        )
                            );
                            
        $("#header").after(alert);
        return alert;
    };

    module.exports = {
        create_alert : create_alert
    };
});
