define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_contents){

    /*  
     *  Creates the modal that pops up when "Add Metadata" is clicked.
     *  It uses the dialog module from the main notebook to create a dialog.
     *  It creates the form body by running create_fields(), and adds some
     *  labelling fluff. it also defines previous and next butttons and 
     *  assigns the logic to these buttons that tells them when to change page,
     *  which is done via toggling visibility using a class "hide-me" and also
     *  calls the validator functions and uses them to dictate when a page is 
     *  allowed to change. Also finally calls save metadata before the modal is
     *  dismissed.
     */ 
    var add_metadata = function() {
        var form_fields = create_fields();

        var form_body = $("<div/>").attr("title", "Add the metadata")
            .append(
                $("<form/>").attr("id","add_metadata_form").append(
                        $("<label/>")
                        .attr("for","add_metadata_form")
                        .text("Add the metadata for the notebook."))
                        .append(form_fields.form1)
                        .append(form_fields.form2)
            );
        
        var modal = dialog.modal({
            title: "Add " + Jupyter.notebook.notebook_name + " Metadata",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { 
                    click: function() {
                        //make a multi page form by changing visibility of the forms
                        if(!$("#fields1").hasClass("hide-me") &&
                            $("#fields2").hasClass("hide-me"))
                        { 
                            //can't go back when we're on the first page
                            $("#previous").addClass("disabled"); 
                        }
                        else if($("#fields1").hasClass("hide-me") &&
                                !$("#fields2").hasClass("hide-me"))
                        {
                            $("#fields2").addClass("hide-me");
                            $("#fields1").removeClass("hide-me");
                            //we want button text to be next on any page
                            //but the last one
                            $("#next").text("Next"); 
                        }
                    }
                },
                Next: { 
                    class : "btn-primary",
                    click: function() {
                        if(!$("#fields1").hasClass("hide-me") &&
                           $("#fields2").hasClass("hide-me"))
                        {
                            validate_fields1();
                            if($(".metadata-form-error").length === 0) {
                                $("#fields1").addClass("hide-me");
                                $("#fields2").removeClass("hide-me");
                                $("#previous").prop("disabled",false);

                                //we want button text to be save on the last page
                                $("#next").text("Save");
                            }
                        }
                        else if($("#fields1").hasClass("hide-me") &&
                                !$("#fields2").hasClass("hide-me"))
                        { //save our metadata
                            validate_fields2();
                            if($(".metadata-form-error").length === 0) {
                                get_values_from_fields().then(function(result) {
                                    Jupyter.notebook.metadata.reportmetadata = result;
                                    Jupyter.notebook.save_notebook();
                                });
                                $("#collections_loaded").remove();
                                $(".modal").modal("hide");
                            }
                        }
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        /*  
         *  The default modal from the notebook automatically has all the buttons
         *  dismiss the modal. This is obviously not desired, so remove the
         *  data dismiss attriute. Also, add_metadata can't be used to select a
         *  licence file due to JS limitations regarding remembering which
         *  file was selected so just disable them.  
         */ 
        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss")
                                                    .attr("id","previous")
                                                    .prop("disabled",true);
            $(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss")
                                                    .attr("id","next");
            //we can't store licence file info in metadata so disable it
            //only allow the option when publishing
            $("#licence-file-radio").prop("disabled",true);
            $("#licence-file").prop("disabled",true);
            $("#licence-file-button").attr("disabled","disabled");

            //need to move the autocomplete widgets since they were generated
            //before the modal had fully loaded
            $(".author-first-name").each(function(index,item) {
                var full_id = $(item).attr("id");
                var id = full_id.split("-").pop(); //get the number at the end of the id
                $("#author-first-name-" + id).autocomplete("option","appendTo","#author-" + id);
            });
            $(".author-last-name").each(function(index,item) {
                var full_id = $(item).attr("id");
                var id = full_id.split("-").pop(); //get the number at the end of the id
                $("#author-last-name-" + id).autocomplete("option","appendTo","#author-" + id);
            });
        });
    };


    /*  
     *  Creates all the form fields and the containers they go in. Also fills
     *  in the fields with any default or previously saved data in the notebook
     *  metadata. It returns the divs form1 and form2, which are the two pages
     *  of form fields in the modal. This is so that publish_notebook can reuse
     *  this code to create the form fields.
     */ 
    var create_fields = function () {
        var md = Jupyter.notebook.metadata;
        var md_set = false;

        //check to see if metadata has previously been set and whether we need
        //to repopulate the form fields
        if(md.hasOwnProperty("reportmetadata")) { 
            md_set = true;
        }

        var form1 = $("<fieldset/>").attr("title","fields1").attr("id","fields1");
        var form2 = $("<fieldset/>").addClass("hide-me").attr("title","fields2").attr("id","fields2");

        var title = $("<input/>")
            .attr("name","title")
            .attr("id","title")
            .attr("type","text")
            .attr("required","required")
            .val("");

        var titleLabel =  $("<label/>")
            .attr("for","title")
            .addClass("required")
            .text("Title: ");


        /*  
         *  Creates an author field with its autocomplete field. Takes an id
         *  and a string (either "first" or "last"). Returns the field.
         */ 
        var generate_author = function(id,first_or_last) {
            var generated_author = $("<input/>")
                .attr("class","author-" + first_or_last + "-name")
                .attr("type","text")
                .attr("id","author-" + first_or_last + "-name-" + id)
                .autocomplete({
                    source: function( request, response ) {
                        var query;
                        if(first_or_last === "last") {
                            query = custom_contents.ldap_search(
                                {
                                    "lastname": request.term,
                                    "firstname": $("#author-first-name-" + id).val()
                                }
                            );
                        } else if (first_or_last === "first") {
                            query = custom_contents.ldap_search(
                                {
                                    "firstname": request.term,
                                    "lastname": $("#author-last-name-" + id).val()
                                }
                            );
                        } else {
                            //set the promise to a reject to protect against if,
                            //for some reason, first_or_last is wrong.
                            query = Promise.reject("Neither a first nor last " +
                                                   "name field generated this " +
                                                   "request so invalid"); 
                        }
                        query.then(function(data) {
                            response($.map(data, function(item) {
                                var parsed = JSON.parse(item);
                                return parsed.attributes.displayName;
                            }));
                        }).catch(function(reason) {
                            var ldap_error = $("<div/>")
                                .addClass("ldap-error")
                                .text("Error: " + reason.text)
                                .css("color","red");
                            $("label[for=\"author\"]").after(ldap_error);
                        });
                    },
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
                    },
                    appendTo: "#author-" + id,
                    minLength:1,
                    delay: 750,
                });

            if(id === 0) {
                generated_author.autocomplete({
                    select: function( event, ui ) {
                        var person = ui.item.value;
                        var person_split = person.split(" ");
                        var sn = person_split[0].slice(0,-1);
                        var fn = person_split[1];
                        var department = person_split[2].split(",")[2].slice(0,-1);

                        if(first_or_last === "last") {
                            $(this).val(sn);
                            $(this).parent().children().eq(1).val(fn);
                        } else {
                            $(this).val(fn);
                            $(this).parent().children().eq(0).val(sn);
                        }
                        
                        /*  
                         *  departments in LDAP have different names to DSpace
                         *  repositories, so convert them using a "map"
                         */ 
                        var deps_to_reps = {
                            "SC": "SCD",
                            "RALSP": "RAL Space",
                            "DIA": "DLS",
                            "TECH":"Technology",
                            "CLF":"CLF",
                            "ISIS":"ISIS",
                            "PPD":"PPD",
                            "AST":"ASTeC",
                            "UKATC":"UKATC"
                        };
                        var repository = deps_to_reps[department];
                        $("#repository").val($("#repository option").filter(function() {
                            return $(this).text() === repository;
                        }).val());

                        return false;
                    }
                });
            } else {
                generated_author.autocomplete({
                    select: function( event, ui ) {
                        var person = ui.item.value;
                        var person_split = person.split(" ");
                        var sn = person_split[0].slice(0,-1);
                        var fn = person_split[1];
                        if(first_or_last === "last") {
                            $(this).val(sn);
                            $(this).parent().children().eq(1).val(fn);
                        } else {
                            $(this).val(fn);
                            $(this).parent().children().eq(0).val(sn);
                        }
                        return false;
                    }
                });
            }
            return generated_author;
        };

        var defaultAuthorLastName = generate_author(0,"last");
        defaultAuthorLastName.attr("required","required");
        var defaultAuthorFirstName = generate_author(0,"first");
        defaultAuthorFirstName.attr("required","required");

        //we only have one spinner that is passed around, so we create it
        //(hidden by default) and attach it somewhere (it doesn't matter
        //where it is attached tbh, i've appended it to author)
        var spinner = $("<i/>")
            .addClass("fa fa-spinner fa-spin fa-fw fa-lg")
            .attr("id","author-autocomplete-spinner")
            .attr("aria-label","Searching for authors...")
            .hide();

        var accessibility_spinner = $("<span/>")
            .addClass("sr-only")
            .attr("id","accessibility-spinner")
            .text("Searching for authors...")
            .hide();

        var authorLabel = $("<label/>")
            .attr("for","author")
            .addClass("required")
            .text("Author: ");

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
            .append(authorsLastNameLabel)
            .append(authorsFirstNameLabel)
            .append(defaultAuthor);

        var additionalAuthorsLabel = $("<label/>")
            .attr("for","additional-authors")
            .text("Additional Authors: ");

        var additionalAuthorsFirstNameLabel = $("<label/>")
            .attr("for","author-first-name-1")
            .text("First name(s), e.g. John: ");

        var additionalAuthorsLastNameLabel = $("<label/>")
            .attr("for","author-last-name-1")
            .text("Last name, e.g. Smith: ");

        var additionalLastName = generate_author(1,"last");
        var additionalFirstName = generate_author(1,"first");

        var additionalAuthor = ($("<div/>"))
            .addClass("author additional-author")
            .attr("id","author-1")
            .append(additionalLastName)
            .append(additionalFirstName);

        var addAuthorButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add")
            .attr("id","add-author-button")
            .attr("type","button")
            .attr("aria-label","Add author")
            .bind("click",addAuthor);

        addAuthorButton.append($("<i>")
                       .addClass("fa fa-plus")
                       .attr("aria-hidden","true"));
        additionalAuthor.append(addAuthorButton);

        var additionalAuthors = $("<div/>").attr("id","additional-authors")
            .append(additionalAuthorsLastNameLabel)
            .append(additionalAuthorsFirstNameLabel)
            .append(additionalAuthor);


        /*  
         *  Creates a new additional author, adds the add button to the new
         *  author and adds a remove button to the previous author.
         *  Returns an array containing the  last name field, the first name field 
         *  and the container that contains the entire author (both fields and the button)
         */ 
        var authorcount = 2;
        function addAuthor() {
            var newAuthor = ($("<div/>"));
            
            var firstName = generate_author(authorcount,"first");
            var lastName = generate_author(authorcount,"last");

            newAuthor.addClass("author additional-author")
                .attr("id","author-" + authorcount)
                .append(lastName)
                .append(firstName);
            var previousAuthor = $(".additional-author").last();

            //detach from the previously last author input
            //so we can put it back on the new one
            addAuthorButton.detach(); 
            var deleteAuthor = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-author-button")
                .attr("type","button")
                .attr("aria-label","Remove author")
                    .click(function() {
                        previousAuthor.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last author

            deleteAuthor.append($("<i>")
                        .addClass("fa fa-trash")
                        .attr("aria-hidden","true"));
            previousAuthor.append(deleteAuthor);
            additionalAuthors.append(newAuthor.append(addAuthorButton));
            authorcount++;
            return [lastName,firstName,newAuthor];
        }

        var abstractLabel = $("<label/>")
            .attr("for","nb-abstract")
            .addClass("required")
            .text("Abstract: ");

        var abstract = $("<textarea/>")
            .attr("name","abstract")
            .attr("id","nb-abstract")
            .attr("required","required");

        var tagsLabel = $("<label/>")
            .attr("for","tags")
            .text("Tags: ");

        var tags = $("<textarea/>").attr("name","tags").attr("id","tags");

        var dateLabel = $("<label/>")
            .attr("for","date")
            .addClass("required")
            .text("Date: ");

        var date = $("<table/>").attr("id","date");

        var yearLabel = $("<label/>")
            .attr("for","year")
            .addClass("required")
            .text("Year: ")
            .attr("id","year-label");
        var year = $("<input/>")
            .attr("name","year")
            .attr("required","required")
            .attr("id","year");

        var monthLabel = $("<label/>")
            .attr("for","month")
            .text("Month: ")
            .attr("id","month-label");
        var month = $("<select/>").attr("name","month").attr("id","month")
            .append($("<option/>").attr("value","0").text(""))
            .append($("<option/>").attr("value","1").text("January"))
            .append($("<option/>").attr("value","2").text("February"))
            .append($("<option/>").attr("value","3").text("March"))
            .append($("<option/>").attr("value","4").text("April"))
            .append($("<option/>").attr("value","5").text("May"))
            .append($("<option/>").attr("value","6").text("June"))
            .append($("<option/>").attr("value","7").text("July"))
            .append($("<option/>").attr("value","8").text("August"))
            .append($("<option/>").attr("value","9").text("September"))
            .append($("<option/>").attr("value","10").text("October"))
            .append($("<option/>").attr("value","11").text("November"))
            .append($("<option/>").attr("value","12").text("December"));

        var dayLabel = $("<label/>")
            .attr("for","day")
            .text("Day: ")
            .attr("id","day-label");
        var day = $("<input/>").attr("name","day").attr("id","day");

        var dateLabelContainer = $("<tr/>").attr("id","date-label-container");
        var dateInputContainer = $("<tr/>").attr("id","date-input-container");

        dateLabelContainer.append($("<td>").append(yearLabel))
                          .append($("<td>").append(monthLabel))
                          .append($("<td>").append(dayLabel));

        dateInputContainer.append($("<td>").append(year))
                          .append($("<td>").append(month))
                          .append($("<td>").append(day));

        date.append(dateLabelContainer).append(dateInputContainer);

        //default to have the current date selected
        var currtime = new Date();
        day.val(currtime.getDate());
        month.val(currtime.getMonth() + 1);
        year.val(currtime.getFullYear());

        //clear date
        var clear_button = $("<button/>")
            .text("Clear date")
            .attr("type","button")
            .attr("id","clear-date")
            .addClass("btn btn-xs btn-default btn-date")
            .click(function() {
                day.val("");
                month.val("0");
                year.val("");
            });

        //fill the date fields with the default - now
        var now_button = $("<button/>")
            .text("Set to current date")
            .attr("type","button")
            .attr("id","current-date")
            .addClass("btn btn-xs btn-default btn-date")
            .click(function() {
                var currtime = new Date();
                day.val(currtime.getDate());
                month.val(currtime.getMonth() + 1);
                year.val(currtime.getFullYear());
            });

        dateInputContainer.append(clear_button);
        dateInputContainer.append(now_button);

        var languageLabel = $("<label/>")
            .attr("for","language")
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

        //default - english?
        language.val("en");

        var expand_button_1 = $("<button/>")
            .addClass("btn btn-info btn-sm btn-collapse")
            .attr("type","button")
            .attr("data-toggle","collapse")
            .attr("data-target","#extra_nb_metadata_1")
            .attr("aria-expanded","false")
            .attr("aria-controls","extra_nb_metadata_1")
            .text("Additional Metadata (click to expand)");

        var extra_nb_metadata_1 = $("<div/>")
            .addClass("collapse")
            .attr("id","extra_nb_metadata_1")
            .append(additionalAuthorsLabel)
            .append(additionalAuthors)
            .append(tagsLabel)
            .append(tags)
            .append(dateLabel)
            .append(date)
            .append(languageLabel)
            .append(language);

        form1.append(titleLabel)
             .append(title)
             .append(authorLabel)
             .append(author)
             .append(abstractLabel)
             .append(abstract)
             .append(expand_button_1)
             .append(extra_nb_metadata_1);
        
        author.append(spinner);
        author.append(accessibility_spinner);

        var publisherLabel = $("<label/>")
            .attr("for","publisher")
            .text("Publisher: ");

        var publisher = $("<input/>")
            .attr("name","publisher")
            .attr("id","publisher");

        var citationsLabel = $("<label/>")
            .attr("for","nb-citations")
            .text("Add citations for any third party resources that have been used in this notebook: ");

        var citations = $("<div/>");

        var citation_div = $("<div/>").addClass("nb-citation_div");

        var citation = $("<input/>")
            .addClass("nb-citation citation")
            .attr("name","citation")
            .attr("id","nb-citation-0");

        var addCitationButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-citation-button")
            .attr("id","add-nb-citation-button")
            .attr("type","button")
            .bind("click",addCitation)
            .attr("aria-label","Add citation");

        addCitationButton.append($("<i>").addClass("fa fa-plus"));

        citation_div.append(citation);
        citation_div.append(addCitationButton);

        citations.append(citation_div);

        var referencedByLabel = $("<label/>")
            .attr("for","nb-referencedBy_div")
            .text("Add URIs for items that reference this notebook or its data: ");

        var referencedBy = $("<input/>")
            .addClass("nb-referencedBy referencedBy")
            .attr("name","referencedBy")
            .attr("id","nb-referencedBy-0");

        var referencedBy_div = $("<div/>").addClass("nb-referencedBy_div");

        var referencedBy_divs = $("<div/>");

        var addReferencedByButton = $("<button/>")
            .addClass("btn btn-xs btn-default btn-add add-ReferencedBy-button")
            .attr("id","add-nb-referencedBy-button")
            .attr("type","button")
            .bind("click",addReferencedBy)
            .attr("aria-label","Add referenced by URL");

        addReferencedByButton.append($("<i>").addClass("fa fa-plus"));

        referencedBy_div.append(referencedBy);
        referencedBy_div.append(addReferencedByButton);

        referencedBy_divs.append(referencedBy_div);

        var referencedByCount = 1;
        var citationCount = 1;

        /*  
         *  Similar to addAuthor, but for referencedBy. Again, returns the
         *  actual new field and the container that hold both it and the button 
         */ 
        function addReferencedBy() {
            var newReferencedBy_div = ($("<div/>")).addClass("nb-referencedBy_div");
            var newReferencedBy = $("<input/>")
                .attr("class","nb-referencedBy referencedBy")
                .attr("type","text")
                .attr("id","nb-referencedBy-" + referencedByCount);

            var previousReferencedBy = $(".nb-referencedBy_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addReferencedByButton.detach(); 
            var deleteReferencedBy = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-nb-referencedBy-button remove-referencedBy-button")
                .attr("type","button")
                .attr("aria-label","Remove referenced By URL")
                    .click(function() {
                        previousReferencedBy.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteReferencedBy.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previousReferencedBy.append(deleteReferencedBy);
            referencedBy_divs.append(newReferencedBy_div.append(newReferencedBy).append(addReferencedByButton));
            referencedByCount++;

            return [newReferencedBy,newReferencedBy_div];
        }

        /*  
         *  Similar to addAuthor and addReferencedBy, but for citation. R
         *  Returns the actual new field and the container that hold both it 
         *  and the button.
         */ 
        function addCitation() {
            var newCitation_div = ($("<div/>")).addClass("nb-citation_div");
            var newCitation = $("<input/>")
                .attr("class","nb-citation citation")
                .attr("type","text")
                .attr("id","nb-citation-" + citationCount);

            var previousCitation = $(".nb-citation_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default btn-remove remove-nb-citation-button remove-citation-button")
                .attr("type","button")
                .attr("aria-label","Remove citation")
                    .click(function() {
                        previousCitation.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteCitation.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            previousCitation.append(deleteCitation);
            citations.append(newCitation_div.append(newCitation).append(addCitationButton));
            citationCount++;

            return [newCitation,newCitation_div];
        }
        
        var fundersLabel = $("<label/>")
            .attr("for","funders")
            .text("Funders: ");

        var funders = $("<input/>")
            .attr("name","funders")
            .attr("id","funders");         

        //TODO: i've removed sponsors from the form for now. Do we need them?
        var sponsorsLabel = $("<label/>")
            .attr("for","sponsors")
            .text("Sponsors: ");

        var sponsors = $("<textarea/>")
            .attr("name","sponsors")
            .attr("id","sponsors");

        var licenceLabel = $("<label/>")
            .attr("for","licence")
            .addClass("required")
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
            .append($("<option/>").attr("value","CC BY").text("CC BY"))
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
            .append($("<option/>").attr("value","EPL-1.0").text("EPL-1.0"))
            .append($("<option/>").attr("value","Other").text("Other"));

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

        var repositoryLabel = $("<label/>")
            .attr("for","repository")
            .addClass("required")
            .text("Department: ");

        var repository = $("<select/>")
            .attr("name","repository")
            .attr("required","required")
            .attr("id","repository")
            .append($("<option/>").attr("value","").text(""));

        //use a promise to do the repository fetch request
        var collections_promise = custom_contents.get_collections();

        /*  
         *  fill the repository/department selector once we've fetched from
         *  DSpace, or add an error to the repository field.
         */ 
        collections_promise.then(function(response) {
            var collections = JSON.parse(response);
            collections.forEach(function(collection) {
                var collection_option = $("<option/>");
                collection_option.attr("value",collection.handle);
                collection_option.text(collection.name);
                repository.append(collection_option);
            });
            $(document.body).append($("<div/>").attr("id","collections_loaded"));
        },function(reason) { //error
            console.log("Error fetching collections from eData: ");
            console.log(reason.xhr);
            var repository_fetch_error = $("<div/>")
                .addClass("repository-fetch-error")
                .text("Couldn't download the repository information from eData." +
                      " Please reload and if the error persists contact the developers.")
                .css("color","red");
            $("label[for=\"repository\"]").after(repository_fetch_error);
        });


        /*  
         *  Users get scared by lots fo scary form fields, so hide the
         *  non-essential ones in collapsible divs and have a button to expand
         *  and collapse them.
         */ 
        var expand_button_2 = $("<button/>")
            .addClass("btn btn-info btn-sm btn-collapse")
            .attr("type","button")
            .attr("data-toggle","collapse")
            .attr("data-target","#extra_nb_metadata_2")
            .attr("aria-expanded","false")
            .attr("aria-controls","extra_nb_metadata_2")
            .text("Additional Metadata (click to expand)");

        var extra_nb_metadata_2 = $("<div/>")
            .addClass("collapse")
            .attr("id","extra_nb_metadata_2")
            .append(publisherLabel)
            .append(publisher)
            .append(citationsLabel)
            .append(citations)
            .append(referencedByLabel)
            .append(referencedBy_divs)
            .append(fundersLabel)
            .append(funders);
            //.append(sponsorsLabel)
            //.append(sponsors)

        
        form2.append(licenceLabel)
             .append(licence)
             .append(repositoryLabel)
             .append(repository)
             .append(expand_button_2)
             .append(extra_nb_metadata_2);

        /*  
         *  Autofilling author and department from Jupyterhub
         */ 
        if(window.location.href.indexOf("user") !== -1) { //we're in jupyterhub
            console.log("jupyterhub!");
            var url_arr = window.location.href.split("/");
            for(var i = 0; i < url_arr.length; i++) {
                if(url_arr[i] === "user") {
                    break;
                }
            }
            var fedID = url_arr[i + 1]; //the url part right after user will be the username
            custom_contents.update_config(JSON.stringify({"username":fedID})).catch(function(reason) {
                var error = $("<div/>")
                    .addClass("config-error")
                    .css("color","red");
                error.text(reason.message);
                form1.prepend(error);
                form2.prepend(error);
            });
            /*
            var url = Jupyter.notebook.contents.base_url + "ldap";
            var settings = {
                processData : false,
                cache: false,
                type : "GET",
                dataType : "json",
                success: function(data) {
                    console.log(data);
                    var parsed = JSON.parse(data);
                    $("#author-first-name-0").val(parsed.attributes.givenName);
                    $("#author-last-name-0").val(parsed.attributes.sn);
                    var department = parsed.attributes.department;
                    var deps_to_reps = {
                        "SC": "SCD",
                        "RALSP": "RAL Space",
                        "DIA": "DLS",
                        "TECH":"Technology",
                        "CLF":"CLF",
                        "ISIS":"ISIS",
                        "PPD":"PPD",
                        "AST":"ASTeC",
                        "UKATC":"UKATC"
                    };
                    var repository = deps_to_reps[department];
                    collections_promise.then(function() {
                        $("#repository").val(repository);
                    });
                }
            };
            $.ajax(url + "?" + $.param({"fedID": fedID}),settings);*/
        }

        /*  
         *  Autofill from config. we only autofill if there hasn't been metadata
         *  saved because author and deparment are required fields and so must
         *  have been filled by the user - since we don't want to overwrite user
         *  values only do it on md_set = false
         */

        if(!md_set) {
            var config_username = "";

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
                $("#author-first-name-0").val(parsed.attributes.givenName);
                $("#author-last-name-0").val(parsed.attributes.sn);
                var department = parsed.attributes.department[0];
                department = department.toUpperCase();
                var deps_to_reps = {
                    "SC": "SCD",
                    "RALSP": "RAL Space",
                    "DIA": "DLS",
                    "TECH":"Technology",
                    "CLF":"CLF",
                    "ISIS":"ISIS",
                    "PPD":"PPD",
                    "AST":"ASTeC",
                    "UKATC":"UKATC"
                };
                var repository = deps_to_reps[department];
                $("#repository").val($("#repository option").filter(function() {
                    return $(this).text() === repository;
                }).val());
            }).catch(function(reason) {
                var error = $("<div/>")
                    .addClass("ldap-error")
                    .css("color","red");
                error.text(reason.message);
                form1.prepend(error);
                form2.prepend(error);
            });
        }
        

        /*  
         *  Repopulate the form fields with previously saved data. Most is pretty
         *  simple, but need to add extra authors, citation and referencedBy fields.
         *  Sadly, it can't add remove buttons on it's own because it requires the
         *  fields already existing or something, so ugly code to add some remove
         *  buttons is here :(
         */ 
        if(md_set) {
            title.val(md.reportmetadata.title);
            var authorsarr = md.reportmetadata.authors;
            var deleteAuthor;
            authorsarr.forEach(function(item,index) {
                if(index === 0) {
                    defaultAuthorLastName.val(item[0]);
                    defaultAuthorFirstName.val(item[1]);
                } else if(index === 1) {
                    additionalLastName.val(item[0]);
                    additionalFirstName.val(item[1]);
                    if(authorsarr.length > 2) {
                        deleteAuthor = $("<button/>")
                            .addClass("btn btn-xs btn-default btn-remove remove-author-button")
                            .attr("type","button")
                            .attr("aria-label","Remove author")
                                .click(function() {
                                    additionalAuthor.remove();
                                    $(this).remove();
                                }); //add a remove button to the previously last author

                        deleteAuthor.append($("<i>")
                                            .addClass("fa fa-trash")
                                            .attr("aria-hidden","true"));
                        additionalAuthor.append(deleteAuthor);
                    }
                } else {
                    var auth = addAuthor();
                    auth[0].val(item[0]);
                    auth[1].val(item[1]);
                    if(index !== authorsarr.length - 1) { //if not last element
                        deleteAuthor = $("<button/>")
                            .addClass("btn btn-xs btn-default btn-remove remove-author-button")
                            .attr("type","button")
                            .attr("aria-label","Remove author")
                                .click(function() {
                                    auth[2].remove();
                                    $(this).remove();
                                }); //add a remove button to the previously last author

                        deleteAuthor.append($("<i>")
                                            .addClass("fa fa-trash")
                                            .attr("aria-hidden","true"));
                        auth[2].append(deleteAuthor);
                    }
                    //TODO: make this nicer? make it so I don"t have to manually add the delete?
                }
            });

            abstract.val(md.reportmetadata.abstract);

            md.reportmetadata.tags.forEach(function(item) {
                tags.val(tags.val() + item + "\n");
            });

            var datearr = md.reportmetadata.date.split("-");
            year.val(datearr[0]);
            if(datearr.length > 1) { //if month and day have been saved check for them
                //need to strip month of leading zero
                if(datearr[1].charAt(0) === "0") {
                    //leading 0, so only take last character
                    datearr[1] = datearr[1].charAt(1);
                }
                month.val(datearr[1]);
                day.val(datearr[2]);
            }

            language.val(md.reportmetadata.language);
            publisher.val(md.reportmetadata.publisher);

            var citationarr = md.reportmetadata.citations;
            var deleteCitation;
            citationarr.forEach(function(item,index) {
                if(index === 0) {
                    citation.val(item);
                    if(citationarr.length > 1) {
                        //need to manually add delete button since addAuthor
                        //relies on finding the previous author using selectors,
                        //which don"t work here since the modal
                        //is still being created I think...
                        deleteCitation = $("<button/>") 
                            .addClass("btn btn-xs btn-default btn-remove remove-citation-button remove-nb-citation-button") 
                            .attr("type","button")
                            .attr("aria-label","Remove citation")
                                .click(function() {
                                    citation.remove();
                                    $(this).remove();
                                });
                        deleteCitation.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        citation_div.append(deleteCitation);
                    }
                    
                } else {
                    var newCitation = addCitation();
                    newCitation[0].val(item);
                    if(index !== citationarr.length - 1) { //if not last element
                        deleteCitation = $("<button/>")
                            .addClass("btn btn-xs btn-default btn-remove remove-citation-button remove-nb-citation-button")
                            .attr("type","button")
                            .attr("aria-label","Remove citaiton")
                                .click(function() {
                                    newCitation[1].remove();
                                    $(this).remove();
                                });
                        deleteCitation.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        newCitation[1].append(deleteCitation);
                    }
                }
            });

            var referencedByarr = md.reportmetadata.referencedBy;
            var deleteReferencedBy;
            referencedByarr.forEach(function(item,index) {
                if(index === 0) {
                    referencedBy.val(item);
                    if(referencedByarr.length > 1) {
                        //need to manually add delete button since addAuthor
                        //relies on finding the previous author using selectors,
                        //which don"t work here since the modal
                        //is still being created I think...
                        deleteReferencedBy = $("<button/>") 
                            .addClass("btn btn-xs btn-default btn-remove remove-referencedBy-button remove-nb-referencedBy-button") 
                            .attr("type","button")
                            .attr("aria-label","Remove referenced By URL")
                                .click(function() {
                                    referencedBy.remove();
                                    $(this).remove();
                                });
                        deleteReferencedBy.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        referencedBy_div.append(deleteReferencedBy);
                    }
                    
                } else {
                    var newReferencedBy = addReferencedBy();
                    newReferencedBy[0].val(item);
                    if(index !== referencedByarr.length - 1) { //if not last element
                        deleteReferencedBy = $("<button/>")
                            .addClass("btn btn-xs btn-default btn-remove remove-referencedBy-button remove-nb-referencedBy-button")
                            .attr("type","button")
                            .attr("aria-label","Remove referenced By URL")
                                .click(function() {
                                    newReferencedBy[1].remove();
                                    $(this).remove();
                                });
                        deleteReferencedBy.append($("<i>")
                                         .addClass("fa fa-trash")
                                         .attr("aria-hidden","true"));
                        newReferencedBy[1].append(deleteReferencedBy);
                    }
                }
            });

            funders.val(md.reportmetadata.funders);
            sponsors.val(md.reportmetadata.sponsors);

            collections_promise.then(function() {
                repository.val(md.reportmetadata.repository);
            });

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
        }

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

        if($("#title").val() === "") {
            var title_error = $("<div/>")
                .attr("id","title-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter a title");

            $("label[for=\"title\"]").after(title_error);
        }
        if($("#nb-abstract").val() === "") {
            var abstract_error = $("<div/>")
                .attr("id","nb-abstract-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter an abstract");

            $("label[for=\"nb-abstract\"]").after(abstract_error);
        }
        if($("#author-first-name-0").val() === "" || $("#author-last-name-0").val() === "") {
            var author_error = $("<div/>")
                .attr("id","author-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter an author");

            $("label[for=\"author\"]").after(author_error);
        }
        var isInteger = function(str,greaterthan,lessthan) {
            var n = ~~Number(str); //convert into a number with no decimal part
            return String(n) === str && n > greaterthan && n < lessthan;
        };
        //checks to see if something is a valid date (including leap year stuff)
        var validDate = function(daystr,month,yearstr) {
            if(!isInteger(daystr,0,32)) {
                return false;
            }
            var day = Number(daystr); 
            var year = Number(yearstr); //should be an int from the above checks

            var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            // Adjust for leap years
            if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                monthLength[1] = 29;
            }
            return day > 0 && day <= monthLength[month - 1];
        };

        //date checking. else ifs because previous errors affect later errors
        //(e.g. invalid year affects day validity etc)
        if($("#year").val() === "") {
            var no_year_error = $("<div/>")
                .attr("id","year-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter at least the year of publication");

            $("label[for=\"date\"]").after(no_year_error);
        } else if(!isInteger($("#year").val(),1800,3000)) {
            var bad_year_error = $("<div/>")
                .attr("id","invalid-year-error")
                .addClass("metadata-form-error")
                .text("Please enter a valid year");

            $("label[for=\"date\"]").after(bad_year_error);
        } else if($("#day").val() !== "" && $("#month").val() === "0") {
            var month_error = $("<div/>")
                .attr("id","month-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a month");

            $("label[for=\"date\"]").after(month_error);
        } else if($("#day").val() !== "" &&
                  !validDate($("#day").val(),$("#month").val(),$("#year").val()))
        {
            var day_error = $("<div/>")
                .attr("id","invalid-day-error")
                .addClass("metadata-form-error")
                .text("Please enter valid day");

            $("label[for=\"date\"]").after(day_error);
        }
        $(".metadata-form-error").css("color", "red");
    };

    /*  
     *  Extract the values from the form fields and return a promise that will
     *  have all the values in a single object once it is resolved.
     *  This is needed so we can wait for file upload to complete.
     */ 
    var get_values_from_fields = function() {
        var return_data = {};
        return_data.title = $("#title").val();

        return_data.authors = [];
        $(".author").each(function(i,e) {
            var authorarr = [];
            var ln = $(e).children(".author-last-name").val();
            var fn = $(e).children(".author-first-name").val();
            if(ln !== "" || fn !== "") {
                authorarr.push(ln);
                authorarr.push(fn);
                return_data.authors.push(authorarr);
            }
        });
        return_data.abstract = $("#nb-abstract").val();

        //Split our textarea by lines
        var split = $("#tags").val().split("\n");
        var lines = [];
        for (var i = 0; i < split.length; i++) {
            if (split[i]) { //make sure we don't add any empty lines!
                lines.push(split[i]);
            }
        }
        return_data.tags = lines;

        var monthstring = "";
        if ($("#month").val() < 10) {
            //we need a leading zero to match DSpace's date format
            monthstring = "0" + $("#month").val();
        } else {
            monthstring = $("#month").val();
        }
        if(monthstring === "00") { //if no month set it to just be the year
            return_data.date = $("#year").val();
        } else if ($("#day").val() === "") { //month is set but day isn"t
            return_data.date = $("#year").val() + "-" + monthstring;
        } else {
            return_data.date = $("#year").val() + "-" + monthstring +
                                     "-" + $("#day").val();
        }

        return_data.language = $("#language").val();
        return_data.publisher = $("#publisher").val();

        return_data.citations = [];
        $(".nb-citation").each(function(i,e) {
            if($(e).val() !== "") {
                return_data.citations.push($(e).val());
            }
        });
        
        return_data.referencedBy = [];
        $(".nb-referencedBy").each(function(i,e) {
            if($(e).val() !== "") {
                return_data.referencedBy.push($(e).val());
            }
        });

        return_data.funders = $("#funders").val();
        return_data.sponsors = $("#sponsors").val();

        return_data.licence_preset = $("#nb-licence-dropdown").val();
        return_data.licence_url = $("#licence-url").val();
        

        return_data.repository = $("#repository").val();

        /* 
         *  need to ensure that the file has been upload before
         *  we go off uploading so have a promise that resolves
         *  when the file upload is done. If there is no file
         *  upload to be done, then just return a resolved
         *  promise
         */
        var promise;
        if($("#licence-file").val()) {
            var licence_file = $("#licence-file").prop("files")[0];

            promise = new Promise(function(resolve,reject) {
                var reader = new FileReader();

                reader.onload = function(e) {
                    return_data.licence_file_name = $("#licence-file").val();
                    return_data.licence_file_contents = e.target.result;
                    resolve(return_data);
                };

                reader.onerror = function() {
                    //TODO: handle error
                    reject();
                };

                reader.readAsDataURL(licence_file);
            });
        } else {
            promise = Promise.resolve(return_data);
        }

        return promise;        
    };

    /*  
     *  Get metadata from saved metadata. Used for bundle upload only as well
     *  as the test notebook upload.
     */ 
    var get_values_from_metadata = function() {
        var data = {
            "title":Jupyter.notebook.metadata.reportmetadata.title,
            "authors":Jupyter.notebook.metadata.reportmetadata.authors,
            "abstract":Jupyter.notebook.metadata.reportmetadata.abstract,
            "tags":Jupyter.notebook.metadata.reportmetadata.tags,
            "date":Jupyter.notebook.metadata.reportmetadata.date,
            "language":Jupyter.notebook.metadata.reportmetadata.language,
            "publisher":Jupyter.notebook.metadata.reportmetadata.publisher,
            "citations":Jupyter.notebook.metadata.reportmetadata.citations,
            "referencedBy":Jupyter.notebook.metadata.reportmetadata.referencedBy,
            "funders":Jupyter.notebook.metadata.reportmetadata.funders,
            "sponsors":Jupyter.notebook.metadata.reportmetadata.sponsors,
            "repository":Jupyter.notebook.metadata.reportmetadata.repository,
            "licence_preset":Jupyter.notebook.metadata.reportmetadata.licence_preset,
            "licence_url": Jupyter.notebook.metadata.reportmetadata.licence_url
        };
        return data;
    };


    /*  
     *  Validates the second page of the add_metadata form
     *  If it finds errors it attaches an error div after
     *  the offending fields asscoaited label. It also clears
     *  any old errors before it runs.
     */ 
    var validate_fields2 = function() {
        $(".metadata-form-error").remove(); //clear errors
        if(!$("#repository").val()) {
            var repository_error = $("<div/>")
                .attr("id","repository-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a repository to deposit to");

            $("label[for=\"repository\"]").after(repository_error);
        }

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

        $(".metadata-form-error").css("color", "red");
    };

    /*  
     *  The below adds an action to the notebook and assigns the add_metadata
     *  function to the Add metadata function, and handles exporting the
     *  functions we use in other modules/files.
     */ 

    var action = {
        help: "Add notebook metadata",
        help_index: "a",
        icon: "fa-bars",
        handler : add_metadata,
    };

    var prefix = "linker_extension";
    var action_name = "add-notebook-metadata";

    var load = function () {
        Jupyter.actions.register(action,action_name,prefix);
        $("#add_metadata").click(function () {
            add_metadata();
        });
    };

    module.exports = {
        load: load,
        validate_fields1: validate_fields1,
        validate_fields2: validate_fields2,
        create_fields: create_fields,
        get_values_from_fields: get_values_from_fields,
        get_values_from_metadata: get_values_from_metadata
    };
});