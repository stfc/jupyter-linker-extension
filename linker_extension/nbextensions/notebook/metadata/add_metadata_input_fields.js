define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents",
        "./add_metadata_author",
        "./add_metadata_date",
        "./add_metadata_department",
        "./add_metadata_licences",
        "./add_metadata_tos"
],function(Jupyter,
		   utils,
		   dialog,
		   custom_contents,
		   authors,
		   date,
		   department,
		   licences,
		   tos){	
	var md = Jupyter.notebook.metadata;
	
	/*  
     *  Title of the item to be published in DSpace
     *  
     *  This field is mandatory, so must be validated.
     */ 
	function title_field() {
		var title_div = $("<div/>");
		
        var title_label =  $("<label/>")
            .attr("for","title")
            .addClass("required")
            .addClass("fieldlabel")
            .text("Title: ");
    
        var title = $("<input/>")
            .attr("name","title")
            .attr("id","title")
            .addClass("title-input")
            .attr("type","text")
            .attr("required","required")
            .val("");
        
        title.val(md.reportmetadata.title);
        
        title_div.append(title_label);
        title_div.append(title);
        
        return(title_div);
	}
	
	function validate_title() {
        if($("#title").val() === "") {
            var title_error = $("<div/>")
                .attr("id","title-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter a title");

            $("label[for=\"title\"]").after(title_error);
        }
	}
	
	/*  
     *  Abstract of the item. This is taken from the first cell of the notebook.
     *  
     *  This field is mandatory, so must be validated.
     */ 
	function abstract_field() {
		var abstract_div = $("<div/>");
    	var abstract_label = $("<label/>").attr("for","nb-abstract")
                                          .addClass("fieldlabel")
                                          .text("Abstract: ");
    	var abstract_note = $("<span/>").attr("for","nb-abstract")
                                         .addClass("fieldnote")
                                         .text("Note: This is taken from the first cell of the notebook, so cannot be edited here.");

        var abstract_input = $("<textarea/>").attr("name","abstract")
                                             .attr("id","nb-abstract")
                                             .attr("readonly","readonly")
                                             .attr("required","required");
        
        //Fill the abstract from the first notebook cell.
        if(Jupyter.notebook.get_cell(0).cell_type === "markdown") {
            abstract_input.val(Jupyter.notebook.get_cell(0).get_text());
        }
        
        abstract_div.append(abstract_label)
                    .append(abstract_input)
                    .append(abstract_note);
            
        return(abstract_div);
	}
	
	function validate_abstract() {
        if(Jupyter.notebook.get_cell(0).cell_type !== "markdown" ||
           $("#nb-abstract").val() === "") {
            var abstract_invalid_error = $("<div/>")
                .attr("id","nb-abstract-invalid-error")
                .addClass("metadata-form-error")
                .text("Please exit this dialog and create a markdown cell " +
                      "at the top of the notebook to be used as an abstract");

            $("label[for=\"nb-abstract\"]").after(abstract_invalid_error);
        }
	}
	
	/*  
     *  Tags for the item when indexed in DSpace.
     *  
     *  This field is optional.
     */ 
	function tags_field() {
		var tags_div = $("<div/>");
    	var tags_label = $("<label/>").attr("for","tags")
                                      .addClass("fieldlabel")
                                      .text("Tags: ");

    	var tags_input = $("<textarea/>").attr("name","tags").attr("id","tags");
        
    	if (md.reportmetadata.hasOwnProperty("tags")) {
    		md.reportmetadata.tags.forEach(function(item) {
                tags_input.val(tags_input.val() + item + "\n");
            });
    	}
    	
        tags_div.append(tags_label)
                .append(tags_input);
            
        return(tags_div);
	}
	
	/*  
     *  The language of the item being published
     *  
     *  This field is optional, but defaults to English (GB)
     */ 
	function language_field() {
		var language_div = $("<div/>");
		
		var languageLabel = $("<label/>").attr("for","language")
                                         .addClass("fieldlabel")
                                         .text("Language: ");

        var language = $("<select/>")
            .attr("name","language")
            .attr("id","language")
            .append($("<option/>").attr("value","").text("n/A"))
            .append($("<option/>").attr("value","en_US").text("English (US)"))
            .append($("<option/>").attr("value","en").text("English (GB) (Default)"))
            .append($("<option/>").attr("value","es").text("Spanish"))
            .append($("<option/>").attr("value","de").text("German"))
            .append($("<option/>").attr("value","fr").text("French"))
            .append($("<option/>").attr("value","it").text("Italian"))
            .append($("<option/>").attr("value","ja").text("Japanese"))
            .append($("<option/>").attr("value","zh").text("Chinese"))
            .append($("<option/>").attr("value","tr").text("Turkish"))
            .append($("<option/>").attr("value","other").text("Other"));

        language.val("en");
        
        language_div.append(languageLabel)
                    .append(language);
        
        language.val(md.reportmetadata.language);
        
        return(language_div);
	}
	
	/*  
     *  Publisher of the item.
     *  
     *  This field is optional.
     */ 
	function publisher_field() {
		var publisher_div = $("<div/>");
		
        var publisherLabel = $("<label/>")
            .addClass("fieldlabel")
            .attr("for","publisher")
            .text("Publisher: ");

        var publisher = $("<input/>")
            .attr("name","publisher")
            .attr("id","publisher");
        
        publisher_div.append(publisherLabel).append(publisher);
        
        publisher.val(md.reportmetadata.publisher);
        
        return publisher_div;
	}
	
	/*  
     *  Funders for the project the data is associated with.
     *  
     *  This field is optional.
     */ 	
	function funders_field() {
		var funders_div = $("<div/>");
		
        var funders_label = $("<label/>")
            .attr("for","funders")
            .addClass("fieldlabel")
            .text("Funders: ");

        var funders = $("<input/>")
            .attr("name","funders")
            .attr("id","funders");         

        funders_div.append(funders_label).append(funders);
        
        funders.val(md.reportmetadata.funders);
        
        return funders_div;
	}
	
	/*  
     *  Sponsors for the project the data is associated with.
     *  
     *  This field is optional, and currentlly not used.
     */ 
	function sponsors_field() {
		var sponsors_div = $("<div/>");

        var sponsorsLabel = $("<label/>")
            .attr("for","sponsors")
            .addClass("fieldlabel")
            .text("Sponsors: ");

        var sponsors = $("<textarea/>")
            .attr("name","sponsors")
            .attr("id","sponsors");
        
        sponsors_div.append(sponsors_label).append(sponsors);
        
        sponsors.val(md.reportmetadata.sponsors);
        
        return sponsors_div;
	}
	
	/*  
     *  Any citations of third party resources.
     *  
     *  This field is optional.
     */ 
	function citations_field() {
		var citations_div = $("<div/>").attr("id","nb-citations");
		    
        var citationsLabel = $("<label/>")
            .addClass("fieldlabel")
            .attr("for","nb-citations")
            .text("Citations for third party resources: ");

        var citation_container = $("<div/>").addClass("nb-citation-container");

        var citationCount = 0;

	    var addCitationButton = $("<button/>")
	        .addClass("btn btn-xs btn-default btn-add add-citation-button")
	        .attr("id","add-nb-citation-button")
	        .attr("type","button")
	        .attr("aria-label","Add citation")
	        .click(addCitation)
	        .append($("<i>").addClass("fa fa-plus"));
	    
	    var lastCitation;
        function addCitation() {
            var newCitation_div = $("<div/>").addClass("nb-citation-div");
            var newCitation = $("<input/>")
                .attr("class","nb-citation citation")
                .attr("type","text")
                .attr("id","nb-citation-" + citationCount);

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-nb-citation-button remove-citation-button")
                .attr("type","button")
                .attr("aria-label","Remove citation")
                .append($("<i>").addClass("fa fa-trash")
                                .attr("aria-hidden","true"));
           
            if (lastCitation != undefined) {
            	lastCitation.append(deleteCitation);
            }
            
            citation_container.append(newCitation_div.append(newCitation)
            		                                 .append(addCitationButton));

            lastCitation = newCitation_div;;
            
            citationCount++;

            return newCitation;
        }
        
        citations_div.append(citationsLabel).append(citation_container);
        
        var citation_array = md.reportmetadata.citations;
        
        if (citation_array == undefined || citation_array.length == 0) {
        	addCitation();
        }
        
        if (citation_array != undefined) {
            citation_array.forEach(function(item,index) {
                var newCitation = addCitation();
                newCitation.val(item);
            });
        }

        return citations_div;
	}
	
	/*  
     *  Any URIs that reference the notebook or the data.
     *  
     *  This field is optional.
     */ 
	function referenced_by_field() {
		var referenced_by_div = $("<div/>");
		
        var referenced_by_label = $("<label/>")
            .addClass("fieldlabel")
            .attr("for","nb-referenced-bys")
            .text("URIs referencing this notebook/data: ");

        var referenced_by_count = 0;
        
        var referenced_by = $("<input/>")
            .addClass("nb-referenced-by referenced-by")
            .attr("name","referenced-by")
            .attr("id","nb-referenced-by-0");

        var referenced_by_container = $("<div/>").attr("id","nb-referenced-bys");

        var last_referenced_by;
        
        function add_referenced_by() {
            var new_referenced_by_div = ($("<div/>")).addClass("nb-referenced_by_div");
            var new_referenced_by = $("<input/>")
                .attr("class","nb-referenced-by referenced-by")
                .attr("type","text")
                .attr("id","nb-referenced-by-" + referenced_by_count);

            add_referenced_by_button.detach(); 
            
            var delete_referenced_by = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-nb-referenced-by-button remove-referenced-by-button")
                .attr("type","button")
                .attr("aria-label","Remove referenced By URL");

            delete_referenced_by.append($("<i>")
                                .addClass("fa fa-trash")
                                .attr("aria-hidden","true"));
            
            if (last_referenced_by != undefined) {
            	last_referenced_by.append(delete_referenced_by);
            }
            
            new_referenced_by_div.append(new_referenced_by).append(add_referenced_by_button);
            referenced_by_container.append(new_referenced_by_div);
            last_referenced_by = new_referenced_by_div;
            referenced_by_count++;

            return new_referenced_by;
        }
        
        var add_referenced_by_button = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-referenced-by-button")
            .attr("id","add-nb-referenced-by-button")
            .attr("type","button")
            .attr("aria-label","Add referenced by URL")
            .click(add_referenced_by)
            .append($("<i>").addClass("fa fa-plus"));

        referenced_by_div.append(referenced_by_label).append(referenced_by_container);
        
        var referencedByarr = md.reportmetadata.referencedBy;
        
        if (referencedByarr == undefined || referencedByarr.length == 0) {
        	add_referenced_by();
        }
        
        if (referencedByarr != undefined) {
            referencedByarr.forEach(function(item,index) {
                add_referenced_by().val(item);
            });
        }

        return referenced_by_div;
	}
		
    /*  
     *  Get the user's username and department. This is used to autofill the author and department.
     *  
     *  Returns a list of strings: [first_name, last_name, department]
     */
	function update_name_and_dept() {
        var config_username = "";
        
        var first_name = "";
        var last_name = "";
        var department = "";

        custom_contents.get_config().then(function(response){
            config_username = response.username;

            //activate ldap_search promise
            return custom_contents.ldap_search({fedID: config_username});
        }).catch(function(reason){
            var error = $("<div/>")
                .addClass("config-error")
                .css("color","red");
            error.text(reason.message);
            form1.prepend(error);
            form2.prepend(error);
        }).then(function(response) {
            //resolve the ldap_search promise
            var parsed = JSON.parse(response);
            first_name = parsed.attributes.givenName;
            last_name = parsed.attributes.sn;
            department = parsed.attributes.department[0].toUpperCase();
            
            spinner.hide();
            accessibility_spinner.hide();
        }).catch(function(reason) {
            var error = $("<div/>")
                .addClass("ldap-error")
                .css("color","red");
            error.text(reason.message);
            form1.prepend(error);
            form2.prepend(error);
        });
        
        return [first_name, last_name, department];
	}
	

    var create_forms = function () {
        //event delegation for remove buttons - remove the parent container
        $("body").on("click",".btn-remove", function() {
            $(this).parent().remove();
        });

        var form1 = $("<fieldset/>").attr("id","md_fields1");
        
        var expand_button_1 = $("<button/>")
            .addClass("btn btn-info btn-sm btn-collapse")
            .attr("type","button")
            .attr("id","expand_1")
            .attr("data-toggle","collapse")
            .attr("data-target","#extra_metadata_1")
            .attr("aria-expanded","false")
            .attr("aria-controls","extra_metadata_1")
            .text("Additional Metadata (click to expand)");

        var extra_metadata_1 = $("<div/>")
            .addClass("collapse")
            .attr("id","extra_metadata_1")
            .append(authors.additional_authors())
            .append(tags_field())
            .append(date.date_field())
            .append(language_field());

        form1.append(title_field())
             .append(abstract_field())
             .append(authors.author_fields())
             .append(expand_button_1)
             .append(extra_metadata_1);
 
        var form2 = $("<fieldset/>").addClass("hide-me").attr("id","md_fields2");

        var expand_button_2 = $("<button/>")
            .addClass("btn btn-info btn-sm btn-collapse")
            .attr("type","button")
            .attr("id","expand_2")
            .attr("data-toggle","collapse")
            .attr("data-target","#extra_metadata_2")
            .attr("aria-expanded","false")
            .attr("aria-controls","extra_metadata_2")
            .text("Additional Metadata (click to expand)");
        
        var extra_metadata_2 = $("<div/>")
            .addClass("collapse")
            .attr("id","extra_metadata_2")
            .append(publisher_field())
            .append(funders_field())
            .append(citations_field())
            .append(referenced_by_field());

        form2.append(licences.licence_field())
             .append(department.department_fields())
             .append(tos.tos_field())
             .append(expand_button_2)
             .append(extra_metadata_2);

        return {form1: form1, form2: form2};
    };

    /*  
     *  Validates the first page of the add_metadata form
     *  If it finds errors it attaches an error div after
     *  the offending fields asscoaited label. It also clears
     *  any old errors before it runs.
     */ 
    var validate_fields1 = function() {
        $(".metadata-form-error").remove(); //clear errors
        
        validate_title();
        validate_abstract();
        authors.validate_authors();
        date.validate_date();
        
        $(".metadata-form-error").css("color", "red");
    };
    
    /*  
     *  Validates the second page of the add_metadata form
     *  If it finds errors it attaches an error div after
     *  the offending fields asscoaited label. It also clears
     *  any old errors before it runs.
     */ 
    var validate_fields2 = function() {
        $(".metadata-form-error").remove(); //clear errors
        
        department.validate_dept_and_repo();
        licences.validate_licence();
        tos.validate_tos();
        
        $(".metadata-form-error").css("color", "red");
    };

    
    var save_metadata = function(){
    	data = md.reportmetadata;
    	
    	data.title = $("#title").val();
    	data.abstract = $("#nb-abstract").val();
    	
    	//Split the tags textarea by lines
        var split = $("#tags").val().split("\n");
        var tags = [];
        for (var i = 0; i < split.length; i++) {
            if (split[i]) { //avoid empty lines
                tags.push(split[i]);
            }
        }
        
        authors.save_authors_to_metadata();
        data.tags = tags;
        
        date.save_date_to_metadata();
        
        data.language = $("#language").val();
        data.publisher = $("#publisher").val();
        
        licences.save_licence_to_metadata();
        department.save_department_to_metadata();
        data.citations = [];
        $(".nb-citation").each(function(i,e) {
            if($(e).val() !== "") {
                data.citations.push($(e).val());
            }
        });
        
        data.referencedBy = [];
        $(".nb-referenced-by").each(function(i,e) {
            if($(e).val() !== "") {
                data.referencedBy.push($(e).val());
            }
        });

        data.funders = $("#funders").val();
        data.sponsors = $("#sponsors").val();
        
        tos.save_tos_to_metadata();
        
    };
    
    module.exports = {
        validate_fields1: validate_fields1,
        validate_fields2: validate_fields2,
        create_forms: create_forms,
        save_metadata: save_metadata
    };
});