define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../local_data",
        "../../custom_contents"
],function(Jupyter,utils,dialog,local_data,custom_contents){
	var md = Jupyter.notebook.metadata;
	var tos_list;
	
	var tos_field = function() {
        var tosLabel = $("<label/>")
	        .attr("for","tos")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Terms of Service: ");
	
	    var tos = $("<div/>")
	        .attr("name","tos")
	        .attr("id","tos");

	    tos_list = [];
    	if (md.reportmetadata.hasOwnProperty("TOS")) {
    		for (var i = 0; i < md.reportmetadata.TOS.length; i++) {
    			tos_list.push(md.reportmetadata.TOS[i]);
    		}
    	} 
    	
    	var input_container = $("<div/>").addClass("tos-input");
    	
    	var onclick = function () {
    		local_data.open_modal(tos_list, $(".tos-display"));
    	}
        var input_button = $("<button/>").addClass("btn btn-sm btn-default btn-add")
                                       .attr("id", "tos-select")
                                       .text("Select terms of service files")
                                       .click(onclick);
        var input_display = $("<span/>").addClass("tos-display")
                                        .text(local_data.get_display_text(tos_list));
        
        input_container.append(input_button);
        input_container.append(input_display);
	
	    tos.append(tosLabel)
	       .append(input_container);
	    
	    return tos;
	};
	
	var validate_tos = function() {
		if (tos_list.length == 0) {
            var tos_error = $("<div/>")
            .attr("id","tos-error")
            .addClass("metadata-form-error")
            .text("Please select a terms of service file");

        $("label[for=\"tos\"]").after(tos_error);
    	}
	}
	
	var save_tos_to_metadata = function() {
        md.reportmetadata.TOS = tos_list;
	}
	
    module.exports = {
    	tos_field: tos_field,
    	save_tos_to_metadata: save_tos_to_metadata,
    	validate_tos: validate_tos,
    };
});