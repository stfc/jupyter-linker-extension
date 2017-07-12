define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../local_data",
        "../../custom_contents"
],function(Jupyter,utils,dialog,local_data,custom_contents){
	var md = Jupyter.notebook.metadata.reportmetadata;
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
    	if (md.TOS != undefined) {
    		for (var i = 0; i < md.TOS.length; i++) {
    			tos_list.push(md.TOS[i]);
    		}
    	} 
    	
    	var input_container = $("<div/>").addClass("tos-input");
    	
    	var onclick = function () {
    		local_data.open_modal(tos_list, $(".tos-display"));
    	}
        var input_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
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
        md.TOS = tos_list;
	}
	
    module.exports = {
    	tos_field: tos_field,
    	save_tos_to_metadata: save_tos_to_metadata,
    	validate_tos: validate_tos,
    };
});