define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents"
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	
	var licence_fields = function() {
        var licenceLabel = $("<label/>")
	        .attr("for","licence")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Licence: ");
	
	    var licence = $("<div/>")
	        .attr("name","licence")
	        .attr("id","licence");
	
	    //TODO: check that this list is sensible and has all the common
	    //ones that users may select
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
	        //.append($("<option/>").attr("value","Other").text("Other"));
	
	    licenceDropdown.val("CC BY");
	
	    var licenceDropdownLabel = $("<label/>")
	        .attr("for","nb-licence-dropdown")
	        .text("Please select a licence from one of the ones listed below, " + 
	              "or select \"Other\" and specify your own licence");
	
	    var licenceRadioFile = $("<input/>")
	        .attr("name","licence radio")
	        .attr("type","radio")
	        .attr("id","licence-file-radio")
	        .css("display","none")
	        .val("file");
	
	    var licenceRadioFileLabel = $("<label/>")
	        .attr("for","licence-file-radio")
	        .text("File Upload")
	        .css("display","none");
	
	    /*  
	     *  I dislike the default file input, so hide it and use a button and 
	     *  a readonly text field to get the same functionality
	     */ 
	    var licenceFile_container = $("<div/>").css("display","none");
	    var licenceFile_button = $("<span/>")
	        .attr("id","licence-file-button")
	        .addClass("btn btn-sm btn-default btn-file")
	        .text("Browse");
	    var licenceFile_feedback = $("<input/>")
	        .attr("readonly","readonly")
	        .attr("type","text")
	        .prop("disabled",true);
	    var licenceFile = $("<input/>")
	        .attr("name","licence file")
	        .attr("id","licence-file")
	        .attr("type","file");
	    licenceFile_button.append(licenceFile);
	    licenceFile_container.append(licenceFile_button).append(licenceFile_feedback);
	
	    /*  
	     *  Add some event handlers that get the custom file input button
	     *  and readonly field to work.
	     */ 
	    licenceFile.change(function() {
	        var input = $(this);
	        var numFiles = input.get(0).files ? input.get(0).files.length : 1;
	        var label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
	        input.trigger("fileselect", [numFiles, label]);
	    });
	
	    licenceFile.on("fileselect", function(event, numFiles, label) {
	        var log = numFiles > 1 ? numFiles + " files selected" : label;
	
	        licenceFile_feedback.val(log);
	    });
	
	    //TODO: do we keep the "Add Metadata" button? is it okay they can't
	    //specfity a file in advance? Should I either try to allow file upload
	    //in the "Add Metadata" stage or remove the button and only have the
	    //users specify metadata before publishing?
	
	    var licenceFileLabel = $("<label/>")
	        .attr("for","licence-file")
	        .text("Upload a licence file. Note: you can only upload a file " +
	              "when ready to publish. If you are adding metadata in " +
	              "advance, please just select a licence type and change " +
	              "back to \"Other\" and upload your file when publishing.")
	        .css("display","none");
	
	    //dont want to activate the file input if we accidentally click the label
	    licenceFileLabel.click(function(e) {
	        e.preventDefault();
	    });
	
	    var licenceRadioURL = $("<input/>")
	        .attr("name","licence radio")
	        .attr("type","radio")
	        .attr("id","licence-url-radio")
	        .css("display","none")
	        .val("URL");
	
	    var licenceRadioURLLabel = $("<label/>")
	        .attr("for","licence-url-radio")
	        .text("URL")
	        .css("display","none");
	
	    var licenceURL = $("<input/>")
	        .attr("name","licence url")
	        .attr("id","licence-url")
	        .css("display","none")
	        .attr("type","text");
	
	    var licenceURLLabel = $("<label/>")
	        .attr("for","licence-url")
	        .text("Provide a URL that links to your licence")
	        .css("display","none");
	
	    //switch visibility on "Other" selection
	    licenceDropdown.change(function() {
	        if($(this).val() === "Other") {
	            licenceRadioFile.css("display","inline");
	            licenceRadioURL.css("display","inline");
	            licenceFileLabel.css("display","block");
	            licenceURLLabel.css("display","block");
	            licenceRadioFileLabel.css("display","inline");
	            licenceRadioURLLabel.css("display","inline");
	            licenceFile_container.css("display","block");
	            licenceURL.css("display","block");
	        } else {
	            licenceRadioFile.css("display","none");
	            licenceRadioURL.css("display","none");
	            licenceFileLabel.css("display","none");
	            licenceURLLabel.css("display","none");
	            licenceRadioFileLabel.css("display","none");
	            licenceRadioURLLabel.css("display","none");
	            licenceFile_container.css("display","none");
	            licenceURL.css("display","none");          
	        }
	    });
	
	    //disable the other fields when one is selected.
	    licenceRadioFile.change(function() {
	        licenceURL.prop("disabled",true);
	        licenceFile.prop("disabled",false);
	        licenceFile_button.removeAttr("disabled");
	    });
	
	    licenceRadioURL.change(function() {
	        licenceURL.prop("disabled",false);
	        licenceFile.prop("disabled",true);
	        licenceFile_button.attr("disabled","disabled");
	    });
	
	    licence.append(licenceLabel)
	           .append(licenceDropdownLabel)
	           .append(licenceDropdown)
	           .append($("<br/>"))
	           .append(licenceRadioFile)
	           .append(licenceRadioFileLabel)
	           .append(licenceFileLabel)
	           .append(licenceFile_container)
	           .append(licenceRadioURL)
	           .append(licenceRadioURLLabel)
	           .append(licenceURLLabel)
	           .append(licenceURL);
	
	    licenceDropdown.val(md.reportmetadata.licence_preset);
	    if(md.reportmetadata.licence_preset === "Other") {
	        licenceRadioFile.css("display","inline");
	        licenceRadioURL.css("display","inline");
	        licenceFileLabel.css("display","block");
	        licenceURLLabel.css("display","block");
	        licenceRadioFileLabel.css("display","inline");
	        licenceRadioURLLabel.css("display","inline");
	        licenceFile_container.css("display","block");
	        licenceURL.css("display","block");
	    }
	    licenceURL.val(md.reportmetadata.licence_url);
	    if (licenceURL.val()) {
	        licenceRadioURL.prop("checked",true);
	    }
	};
	
	var validate_licence = function() {
        if($("#nb-licence-dropdown").val() === "") {
            var licence_dropdown_error = $("<div/>")
                .attr("id","licence-dropdown-error")
                .addClass("metadata-form-error")
                .text("Please select a licence or select \"Other\" and specify your own.");

            $("label[for=\"licence\"]").after(licence_dropdown_error);
        } else if($("#nb-licence-dropdown").val() === "Other" && 
                  !$("#licence-url-radio").prop("checked") &&
                  !$("#licence-file-radio").prop("checked"))
        {
            var no_licence_error = $("<div/>")
                .attr("id","no-licence-error")
                .addClass("metadata-form-error")
                .text("Please either provide a link to a licence or upload a licence file.");

            $("label[for=\"licence\"]").after(no_licence_error);
        } else if($("#nb-licence-dropdown").val() === "Other" && 
                  $("#licence-url").val() === "" &&
                  $("#licence-url-radio").prop("checked"))
        {
            var no_licence_url_error = $("<div/>")
                .attr("id","no-licence-url-error")
                .addClass("metadata-form-error")
                .text("Please provide a link to a licence file.");

            $("label[for=\"licence-url\"]").after(no_licence_url_error);
        } else if($("#nb-licence-dropdown").val() === "Other" && 
                  $("#licence-file").val() === "" &&
                  $("#licence-file-radio").prop("checked"))
        {
            var no_licence_file_error = $("<div/>")
                .attr("id","no-licence-file-error")
                .addClass("metadata-form-error")
                .text("Please upload a licence file.");

            $("label[for=\"licence-file\"]").after(no_licence_file_error);
        }
	}
	
	var save_licence_to_metadata = function() {
        md.reportmetadata.licence_preset = $("#nb-licence-dropdown").val();
        md.reportmetadata.licence_url = $("#licence-url").val();
	}
	
    module.exports = {

    };
});