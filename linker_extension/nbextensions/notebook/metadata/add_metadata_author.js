define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents",
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	
	var author_fields = function() {
        var defaultAuthorLastName = generate_author(0,true);
        defaultAuthorLastName.attr("required","required");
        var defaultAuthorFirstName = generate_author(0,false);
        defaultAuthorFirstName.attr("required","required");

        //we only have one spinner that is passed around, so we create it
        //(hidden by default) and attach it somewhere (it doesn't matter
        //where it is attached tbh, i've appended it to author)
        var spinner = $("<i/>")
            .addClass("fa fa-spinner fa-spin fa-fw fa-lg")
            .attr("id","author-autocomplete-spinner")
            .attr("aria-label","Searching for authors...");

        var accessibility_spinner = $("<span/>")
            .addClass("sr-only")
            .attr("id","accessibility-spinner")
            .text("Searching for authors...");
        
        var authorLabel = $("<label/>")
            .attr("for","author")
            .addClass("fieldlabel")
            .text("Author:");
        
        var authorsFirstNameLabel = $("<label/>")
            .attr("for","author-first-name-0")
            .addClass("required")
            .text("First name(s), e.g. John: ");

        var authorsLastNameLabel = $("<label/>")
            .attr("for","author-last-name-0")
            .addClass("required")
            .text("Last name, e.g. Smith: ");

        var defaultAuthor = ($("<div/>"))
            .addClass("author")
            .attr("id","author-0")
            .append(defaultAuthorLastName)
            .append(defaultAuthorFirstName);

        var author = $("<div/>").attr("id","author")
            .append(authorLabel)
            .append(authorsLastNameLabel)
            .append(authorsFirstNameLabel)
            .append(defaultAuthor);
        
        defaultAuthorLastName.after(spinner).after(accessibility_spinner);
        spinner.hide();
        accessibility_spinner.hide();
        
        var authorsarr = md.reportmetadata.authors;

        if (authorsarr.length > 0 && authorsarr[0].length > 0) {
        	console.log("Using name from metadata");
        	console.log(authorsarr[0]);
        	defaultAuthorFirstName.val(authorsarr[0][1]);
            defaultAuthorLastName.val(authorsarr[0][0]);
        } else {
        	//Search LDAP for the logged in user's name
            console.log("Searching LDAP for user's name");
        	
        	var config_username = "";
            
            var first_name = "";
            var last_name = "";
            
            custom_contents.get_config().then(function(response){
                config_username = response.username;
                //activate ldap_search promise
                return custom_contents.ldap_search({fedID: config_username});
            }).catch(function(reason){
                console.log(reason.message);
            }).then(function(response) {
                //resolve the ldap_search promise
                var parsed = JSON.parse(response);
                first_name = parsed.attributes.givenName;
                last_name = parsed.attributes.sn;
                defaultAuthorFirstName.val(first_name);
                defaultAuthorLastName.val(last_name);
            }).catch(function(reason) {
            	console.log(reason.message);
            });
        }
 
        return author;
	}
        
	var additional_authors = function() {    
        
        var additionalAuthorsLabel = $("<label/>")
            .attr("for","additional-authors")
            .addClass("fieldlabel")
            .text("Additional Authors: ");

        var additionalAuthorsFirstNameLabel = $("<label/>")
            .attr("for","author-first-name-1")
            .text("First name(s), e.g. John: ");

        var additionalAuthorsLastNameLabel = $("<label/>")
            .attr("for","author-last-name-1")
            .text("Last name, e.g. Smith: ");

        var addAuthorButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add")
            .attr("id","add-author-button")
            .attr("type","button")
            .attr("aria-label","Add author")
            .append($("<i>").addClass("fa fa-plus")
                            .attr("aria-hidden","true"))
            .click(function() {
                addAuthor();
            });

        var additionalAuthors = $("<div/>").attr("id","additional-authors")
            .append(additionalAuthorsLabel)
            .append(additionalAuthorsLastNameLabel)
            .append(additionalAuthorsFirstNameLabel);

        /*  
         *  Creates a new additional author, adds the add button to the new
         *  author and adds a remove button to the previous author.
         *
         *  previousAuthor is an optional argument - used by md_set logic as
         *  when the dialog is being created we can't use jquery selectors since
         *  the items aren't in the DOM yet.
         *
         *  Returns an array containing the  last name field, the first name field 
         *  and the container that contains the entire author (both fields and the button)
         */ 
        var authorcount = 1;
        var lastAuthor;
        
        function addAuthor() {
            var newAuthor = ($("<div/>"));
            
            var firstName = generate_author(authorcount,false);
            var lastName = generate_author(authorcount,true);

            newAuthor.addClass("author additional-author")
                .attr("id","author-" + authorcount)
                .append(lastName)
                .append(firstName);

            //detach from the previously last author input
            //so we can put it back on the new one
            addAuthorButton.detach(); 
            newAuthor.append(addAuthorButton);
            
            if (lastAuthor != undefined) {
                var deleteAuthor = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-author-button")
                .attr("type","button")
                .attr("aria-label","Remove author");

                deleteAuthor.append($("<i>")
                        .addClass("fa fa-trash")
                        .attr("aria-hidden","true"));
                lastAuthor.append(deleteAuthor);
            }

            authorcount++;
            additionalAuthors.append(newAuthor);
            lastAuthor = newAuthor;
            
            return([lastName, firstName]);
        }
        
        var authorsarr = md.reportmetadata.authors;
        
        if (authorsarr.length <= 1) {
        	addAuthor();
        } else {
        	authorsarr.forEach(function(item,index) {
                if(index > 0) {
                	newAuthor = addAuthor();
                    newAuthor[0].val(item[0]);
                    newAuthor[1].val(item[1]);
                } 
            });
        }
        
        return additionalAuthors;
    }
	
	var validate_authors = function() {
        if($("#author-first-name-0").val() === "" || $("#author-last-name-0").val() === "") {
            var author_error = $("<div/>")
                .attr("id","author-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter an author");

            $("label[for=\"author\"]").after(author_error);
        }
        
        $(".additional-author").each(function(i,e) {
            var ln = $(e).children(".author-last-name").val();
            var fn = $(e).children(".author-first-name").val();
            if((ln === "") != (fn === "")) {
                var author_error = $("<div/>")
                    .attr("id","author-missing-error")
                    .addClass("metadata-form-error")
                    .text("Missing information detected in additional authors");

                $("label[for=\"additional-authors\"]").after(author_error);
            }
        });
	}
	
	var save_authors_to_metadata = function() {
        md.reportmetadata.authors = [];
        $(".author").each(function(i,e) {
            var authorarr = [];
            var ln = $(e).children(".author-last-name").val();
            var fn = $(e).children(".author-first-name").val();
            if(ln !== "" || fn !== "") {
                authorarr.push(ln);
                authorarr.push(fn);
                md.reportmetadata.authors.push(authorarr);
            }
        });
	}
	
	/*  
     *  Creates an author field with its autocomplete field. 
     *  
     *  Takes an id and a boolean (true implies surname, false firstname)
     */ 
    var generate_author = function(id,lastname_search) {
    	var first_or_last = (lastname_search ? "last" : "first");
    	var generated_author = $("<input/>")
            .attr("class","author-" + first_or_last + "-name")
            .attr("type","text")
            .attr("id","author-" + first_or_last + "-name-" + id);
    	
        function complete_function(request, response) {
            var query;
            if(lastname_search) {
                query = custom_contents.ldap_search(
                    {
                        "lastname": request.term,
                        "firstname": $("#author-first-name-" + id).val()
                    }
                );
            } else {
                query = custom_contents.ldap_search(
                    {
                        "firstname": request.term,
                        "lastname": $("#author-last-name-" + id).val()
                    }
                );
            }
            
            query.then(function(data) {
                response($.map(data, function(item) {
                    var parsed = JSON.parse(item);
                    //get rid of 03 admin accounts
                    if(parsed.dn.indexOf("OU=Local Admins") === -1) {
                        return parsed.attributes.displayName;
                    }
                }));
            }).catch(function(reason) {
                var ldap_error = $("<div/>")
                    .addClass("ldap-error")
                    .text("Error: " + reason.text)
                    .css("color","red");
                $("label[for=\"author\"]").after(ldap_error);
            });
        };
    	
    	function select_function(event, ui) {
            var person = ui.item.value;
            var person_split = person.split(" ");
            var sn = person_split[0].slice(0,-1);
            var fn = person_split[1];
            if(first_or_last === "last") {
                $(this).val(sn);
                $(this).siblings(".author-first-name").val(fn);
            } else {
                $(this).val(fn);
                $(this).siblings(".author-last-name").val(sn);
            }
            return false;
        };
        
    	var autocomplete_details = {
            source: complete_function,
            select: select_function,
            focus: function() {
                // prevent value inserted on focus
                return false;
            },
            search: function() { 
                //called when search starts, so move our spinner to the
                //currently autocompleteing element (since only one
                //autocomplete can be active at a time this is okay)
                //and show it
                var spinner = $("#author-autocomplete-spinner").detach();
                var accessibility_spinner = $("accessibility-spinner").detach();
                $(this).after(spinner);
                $(this).after(accessibility_spinner);
                spinner.show();
                accessibility_spinner.show();
            },
            response: function() {
                //called when search is completed - hide the spinner
                $("#author-autocomplete-spinner").hide();
                $("accessibility-spinner").hide();
            },
            appendTo: "#author-" + id,
            minLength:1,
            delay: 750,
        };
    	
    	generated_author.autocomplete(autocomplete_details);
        
        return generated_author;
    };
    
    module.exports = {
        author_fields: author_fields,
        additional_authors: additional_authors,
        save_authors_to_metadata: save_authors_to_metadata,
        validate_authors: validate_authors,
    };
});