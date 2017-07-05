define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents"
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	
	var licence_field = function() {
        var licenceLabel = $("<label/>")
	        .attr("for","licence")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Licence: ");
	
	    var licence = $("<div/>")
	        .attr("name","licence")
	        .attr("id","licence");

	    var licenceDropdown = $("<select/>")
	        .attr("name","licence dropdown")
	        .attr("required","required")
	        .attr("id","nb-licence-dropdown")
	        .append($("<option/>").attr("value","").text("None Selected"))
	        .append($("<option/>").attr("value","CC0").text("CC0"))
	        .append($("<option/>").attr("value","CC BY").text("CC BY (Default)"))
	        .append($("<option/>").attr("value","CC BY-SA").text("CC BY-SA"))
	        .append($("<option/>").attr("value","CC BY-NC").text("CC BY-NC"))
	        .append($("<option/>").attr("value","CC BY-ND").text("CC BY-ND"))
	        .append($("<option/>").attr("value","CC BY-NC-SA").text("CC BY-NC-SA"))
	        .append($("<option/>").attr("value","CC BY-NC-ND").text("CC BY-NC-ND"))
	        .append($("<option/>").attr("value","Apache 2.0").text("Apache-2.0"))
	        .append($("<option/>").attr("value","BSD-3-Clause").text("BSD-3-Clause"))
	        .append($("<option/>").attr("value","BSD-2-Clause").text("BSD-2-Clause"))
	        .append($("<option/>").attr("value","GPL-2.0").text("GPL-2.0"))
	        .append($("<option/>").attr("value","GPL-3.0").text("GPL-3.0"))
	        .append($("<option/>").attr("value","LGPL-2.1").text("LGPL-2.1"))
	        .append($("<option/>").attr("value","LGPL-3.0").text("LGPL-3.0"))
	        .append($("<option/>").attr("value","MIT").text("MIT"))
	        .append($("<option/>").attr("value","MPL-2.0").text("MPL-2.0"))
	        .append($("<option/>").attr("value","CDDL-1.0").text("CDDL-1.0"))
	        .append($("<option/>").attr("value","EPL-1.0").text("EPL-1.0"));
	
	    if (md.reportmetadata.licence == undefined) {
	    	licenceDropdown.val("CC BY");
	    } else {
	    	licenceDropdown.val(md.reportmetadata.licence);
	    }
	
	    licence.append(licenceLabel)
	           .append(licenceDropdown);
	    
	    return licence;
	};
	
	var validate_licence = function() {
        if($("#nb-licence-dropdown").val() === "") {
            var licence_dropdown_error = $("<div/>")
                .attr("id","licence-dropdown-error")
                .addClass("metadata-form-error")
                .text("Please select a licence");

            $("label[for=\"licence\"]").after(licence_dropdown_error);
        }
	}
	
	var save_licence_to_metadata = function() {
        md.reportmetadata.licence = $("#nb-licence-dropdown").val();
	}
	
    module.exports = {
    	licence_field: licence_field,
    	save_licence_to_metadata: save_licence_to_metadata,
    	validate_licence: validate_licence,
    };
});