
define([], function(){
    "use strict";

    function load_ipython_extension(){
        console.log('Custom utils loaded');
    }

    var getParameterByName = function(name, url) {
	    if (!url) {
	      url = window.location.href;
	    }
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	};

    var create_alert = function(alert_type, message) {
        var alert = $('<div/>')
                            .addClass("alert alert-dismissible fade in")
                            .addClass(alert_type)
                            .attr('role','alert')
                            .text(message)
                            .append(
                                $('<button/>')
                                .addClass("close")
                                .attr('type','button')
                                .attr('data-dismiss','alert')
                                .attr('aria-label','Close')
                                .append($('<span/>').attr('aria-hidden','true').html('&times;')));
        $('#header').after(alert);
        return alert;
    };

    module.exports = {
    	getParameterByName : getParameterByName,
    	create_alert : create_alert,
        load_ipython_extension: load_ipython_extension
    };
});
