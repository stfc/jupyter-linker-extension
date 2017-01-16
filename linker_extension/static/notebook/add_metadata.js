define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../custom_contents",
        "./modify_notebook_html"
],function(Jupyter,utils,dialog,custom_contents){

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
                            //can"t go back when we"re on the first page
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
                        validate();
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

        modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss")
                                                    .attr("id","previous");
            $(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss")
                                                    .attr("id","next");
            //we can't store licence file info in metadata so disable it
            //only allow the option when publishing
            $("#licence-file-radio").prop("disabled",true);
            $("#licence-file").prop("disabled",true);
        });
    };

    var create_fields = function () {
        var md = Jupyter.notebook.metadata;
        var md_set = false;
        var authorcount = 1;

        var return_fields = {};

        //check to see if metadata has previously been set and whether we need
        //to repopulate the form fields
        if(md.hasOwnProperty("reportmetadata")) { 
            md_set = true;
        }

        var title = $("<input/>")
            .attr("name","title")
            .attr("id","title")
            .attr("type","text")
            .val("");

        return_fields.title = title;

        var titleLabel =  $("<label/>")
            .attr("for","title")
            .text("Title: ");

        var defaultAuthorFirstName = $("<input/>")
            .attr("class","author-first-name")
            .attr("type","text")
            .attr("id","author-first-name-0")
            .on("keydown", function(event) {
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).autocomplete().data("ui-autocomplete").menu.active)
                {
                    event.preventDefault(); //don"t navigate away on tab press
                }
            })
            .autocomplete({
                source: function( request, response ) {
                    var url = Jupyter.notebook.contents.base_url + "ldap";
                    var settings = {
                        processData : false,
                        cache: false,
                        type : "GET",
                        dataType : "json",
                        success: function(data) {
                            response($.map(data, function(item) {
                                var parsed = JSON.parse(item);
                                var sn = parsed.attributes.sn;
                                var fn = parsed.attributes.givenName;
                                var namestring = sn + ", " + fn;
                                return namestring;
                            }));
                        }
                    };
                    $.ajax(url + "?" + 
                           $.param({"firstname": request.term,
                                    "lastname": $("#author-last-name-0").val()}
                          ),settings);
                },
                focus: function() {
                  // prevent value inserted on focus
                    return false;
                },
                select: function( event, ui ) {
                    var name = ui.item.value;
                    var sn = name.split(",")[0].trim();
                    var fn = name.split(",")[1].trim();
                    $(this).val(fn);
                    $(this).parent().children().eq(0).val(sn);
                    return false;
                },
                minLength:1,
            });

        var defaultAuthorLastName = $("<input/>")
            .attr("class","author-last-name")
            .attr("type","text")
            .attr("id","author-last-name-0")
            .on("keydown", function(event) {
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).autocomplete().data("ui-autocomplete").menu.active)
                {
                    event.preventDefault();
                }
            })
            .autocomplete({
                source: function( request, response ) {
                    var url = Jupyter.notebook.contents.base_url + "ldap";
                    var settings = {
                        processData : false,
                        cache: false,
                        type : "GET",
                        dataType : "json",
                        success: function(data) {
                            response($.map(data, function(item) {
                                var parsed = JSON.parse(item);
                                var sn = parsed.attributes.sn;
                                var fn = parsed.attributes.givenName;
                                var namestring = sn + ", " + fn;
                                return namestring;
                            }));
                        }
                    };
                    $.ajax(url + "?" +
                           $.param({"lastname": request.term,
                                    "firstname": $("#author-first-name-0").val()}
                          ),settings);
                },
                focus: function() {
                  // prevent value inserted on focus
                    return false;
                },
                select: function( event, ui ) {
                    var name = ui.item.value;
                    var sn = name.split(",")[0].trim();
                    var fn = name.split(",")[1].trim();
                    $(this).val(sn);
                    $(this).parent().children().eq(1).val(fn);
                    return false;
                },
                minLength:1,
            });

        var authorsLabel = $("<label/>")
            .attr("for","author")
            .text("Authors: ");

        var authorsFirstNameLabel = $("<label/>")
            .attr("for","defaultAuthorFirstName")
            .text("First name(s), e.g. John: ");

        var authorsLastNameLabel = $("<label/>")
            .attr("for","defaultAuthorLastName")
            .text("Last name, e.g. Smith: ");

        var defaultAuthor = ($("<div/>"))
            .addClass("author")
            .append(defaultAuthorLastName)
            .append(defaultAuthorFirstName);

        var authors = $("<div/>").attr("id","authors")
            .append(authorsLastNameLabel)
            .append(authorsFirstNameLabel)
            .append(defaultAuthor);

        var addAuthorButton = $("<button/>")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-author-button")
            .attr("type","button")
            .attr("aria-label","Add author")
            .bind("click",addAuthor);

        addAuthorButton.append($("<i>")
                       .addClass("fa fa-plus")
                       .attr("aria-hidden","true"));
        defaultAuthor.append(addAuthorButton);

        function addAuthor() {
            var newAuthor = ($("<div/>"));
            var currcount = authorcount;
            var lastName = $("<input/>")
                .attr("class","author-last-name")
                .attr("type","text")
                .attr("id","author-last-name-" + authorcount)
                .on("keydown", function(event) {
                    if (event.keyCode === $.ui.keyCode.TAB &&
                        $(this).autocomplete().data("ui-autocomplete").menu.active)
                    {
                        event.preventDefault();
                    }
                })
                .autocomplete({
                    source: function( request, response ) {
                        var url = Jupyter.notebook.contents.base_url + "ldap";
                        var settings = {
                            processData : false,
                            cache: false,
                            type : "GET",
                            dataType : "json",
                            success: function(data) {
                                response($.map(data, function(item) {
                                    var parsed = JSON.parse(item);
                                    var sn = parsed.attributes.sn;
                                    var fn = parsed.attributes.givenName;
                                    var namestring = sn + ", " + fn;
                                    return namestring;
                                }));
                            }
                        };
                        $.ajax(url + "?" +
                               $.param({"lastname": request.term,
                                        "firstname": $("#author-first-name-" + currcount).val()}
                              ),settings);
                    },
                    focus: function() {
                      // prevent value inserted on focus
                        return false;
                    },
                    select: function( event, ui ) {
                        var name = ui.item.value;
                        var sn = name.split(",")[0].trim();
                        var fn = name.split(",")[1].trim();
                        $(this).val(sn);
                        $(this).parent().children().eq(1).val(fn);
                        return false;
                    },
                    minLength:1,
                });
            var firstName = $("<input/>")
                .attr("class","author-first-name")
                .attr("type","text")
                .attr("id","author-first-name-" + authorcount)
                .on("keydown", function(event) {
                    if (event.keyCode === $.ui.keyCode.TAB &&
                        $(this).autocomplete().data("ui-autocomplete").menu.active)
                    {
                        event.preventDefault();
                    }
                })
                .autocomplete({
                    source: function( request, response ) {
                        var url = Jupyter.notebook.contents.base_url + "ldap";
                        var settings = {
                            processData : false,
                            cache: false,
                            type : "GET",
                            dataType : "json",
                            success: function(data) {
                                response($.map(data, function(item) {
                                    var parsed = JSON.parse(item);
                                    var sn = parsed.attributes.sn;
                                    var fn = parsed.attributes.givenName;
                                    var namestring = sn + ", " + fn;
                                    return namestring;
                                }));
                            }
                        };
                        $.ajax(url + "?" +
                               $.param({"firstname": request.term,
                                        "lastname": $("#author-last-name-" + currcount).val()}
                              ),settings);
                    },
                    focus: function() {
                      // prevent value inserted on focus
                        return false;
                    },
                    select: function( event, ui ) {
                        var name = ui.item.value;
                        var sn = name.split(",")[0].trim();
                        var fn = name.split(",")[1].trim();
                        $(this).val(fn);
                        $(this).parent().children().eq(0).val(sn);
                        return false;
                    },
                    minLength:1,
                });
            newAuthor.addClass("author")
                .append(lastName)
                .append(firstName);
            var previousAuthor = $(".author").last();

            //detach from the previously last author input
            //so we can put it back on the new one
            addAuthorButton.detach(); 
            var deleteAuthor = $("<button/>")
                .addClass("btn btn-xs btn-default remove-author-button")
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
            authors.append(newAuthor.append(addAuthorButton));
            authorcount++;
            return [lastName,firstName,newAuthor];
        }

        var abstractLabel = $("<label/>")
            .attr("for","abstract")
            .text("Abstract: ");

        var abstract = $("<textarea/>").attr("name","abstract").attr("id","abstract");

        var tagsLabel = $("<label/>")
            .attr("for","tags")
            .text("Tags: ");

        var tags = $("<textarea/>").attr("name","tags").attr("id","tags");

        var dateLabel = $("<label/>")
            .attr("for","date")
            .text("Date: ");

        var date = $("<table/>").attr("id","date");

        var yearLabel = $("<label/>")
            .attr("for","year")
            .text("Year: ")
            .attr("id","year-label");
        var year = $("<input/>").attr("name","year").attr("id","year");

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

        //TODO: Ask about type - surely it will have to be collection for now?


        var languageLabel = $("<label/>")
            .attr("for","language")
            .text("Language: ");

        var language = $("<select/>")
            .attr("name","language")
            .attr("id","language")
            .append($("<option/>").attr("value","").text("n/A"))
            .append($("<option/>").attr("value","en_US").text("English (US)"))
            .append($("<option/>").attr("value","en").text("English"))
            .append($("<option/>").attr("value","es").text("Spanish"))
            .append($("<option/>").attr("value","de").text("German"))
            .append($("<option/>").attr("value","fr").text("French"))
            .append($("<option/>").attr("value","it").text("Italian"))
            .append($("<option/>").attr("value","ja").text("Japanese"))
            .append($("<option/>").attr("value","zh").text("Chinese"))
            .append($("<option/>").attr("value","tr").text("Turkish"))
            .append($("<option/>").attr("value","other").text("Other"));

        var form1 = $("<fieldset/>").attr("title","fields1").attr("id","fields1")
            .append(titleLabel)
            .append(title)
            .append(authorsLabel)
            .append(authors)
            .append(abstractLabel)
            .append(abstract)
            .append(tagsLabel)
            .append(tags)
            .append(dateLabel)
            .append(date)
            .append(languageLabel)
            .append(language);            

        var publisherLabel = $("<label/>")
            .attr("for","publisher")
            .text("Publisher: ");

        var publisher = $("<input/>")
            .attr("name","publisher")
            .attr("id","publisher");

        var citationsLabel = $("<label/>")
            .attr("for","citations")
            .text("Citations: ");

        var citations = $("<div/>");

        var citation_div = $("<div/>").addClass("citation_div");

        var citation = $("<input/>")
            .addClass("citation")
            .attr("name","citation")
            .attr("id","citation-0");

        var addCitationButton = $("<button/>")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-citation-button")
            .attr("type","button")
            .bind("click",addCitation)
            .attr("aria-label","Add citation");

        addCitationButton.append($("<i>").addClass("fa fa-plus"));

        citation_div.append(citation);
        citation_div.append(addCitationButton);

        citations.append(citation_div);

        var referencedByLabel = $("<label/>")
            .attr("for","referencedBy")
            .text("This document is referenced by: ");

        var referencedBy = $("<input/>")
            .addClass("referencedBy")
            .attr("name","referencedBy")
            .attr("id","referencedBy-0");

        var referencedBy_div = $("<div/>").addClass("referencedBy_div");

        var referencedBy_divs = $("<div/>");

        var addReferencedByButton = $("<button/>")
            .addClass("btn btn-xs btn-default")
            .attr("id","add-referencedBy-button")
            .attr("type","button")
            .bind("click",addReferencedBy)
            .attr("aria-label","Add referenced by URL");

        addReferencedByButton.append($("<i>").addClass("fa fa-plus"));

        referencedBy_div.append(referencedBy);
        referencedBy_div.append(addReferencedByButton);

        referencedBy_divs.append(referencedBy_div);

        var referencedByCount = 1;
        var citationCount = 1;

        function addReferencedBy() {
            var newReferencedBy_div = ($("<div/>")).addClass("referencedBy_div");
            var newReferencedBy = $("<input/>")
                .attr("class","referencedBy")
                .attr("type","text")
                .attr("id","referencedBy-" + referencedByCount);

            var previousReferencedBy = $(".referencedBy_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addReferencedByButton.detach(); 
            var deleteReferencedBy = $("<button/>")
                .addClass("btn btn-xs btn-default remove-referencedBy-button")
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

        function addCitation() {
            var newCitation_div = ($("<div/>")).addClass("citation_div");
            var newCitation = $("<input/>")
                .attr("class","citation")
                .attr("type","text")
                .attr("id","citation-" + citationCount);

            var previousCitation = $(".citation_div").last();

            //detach from the previously last url input
            //so we can put it back on the new one
            addCitationButton.detach(); 
            var deleteCitation = $("<button/>")
                .addClass("btn btn-xs btn-default remove-citation-button")
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

        //TODO: i've removed these fields fro the form for now. Do we need them?
        //if we do - figure out a way to use them
        var fundersLabel = $("<label/>")
            .attr("for","funders")
            .text("Funders: ");

        var funders = $("<input/>")
            .attr("name","funders")
            .attr("id","funders");         

        var sponsorsLabel = $("<label/>")
            .attr("for","sponsors")
            .text("Sponsors: ");

        var sponsors = $("<textarea/>")
            .attr("name","sponsors")
            .attr("id","sponsors");

        var licenceLabel = $("<label/>")
            .attr("for","licence")
            .text("Licence: ");

        var licence = $("<div/>")
            .attr("name","licence")
            .attr("id","licence");

        //TODO: check that this list is sensible and has all the common
        //ones that users may select
        var licenceDropdown = $("<select/>")
            .attr("name","licence dropdown")
            .attr("id","licence-dropdown")
            .append($("<option/>").attr("value","").text("n/A"))
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
            .attr("for","licence-dropdown")
            .text("Please select a licence from one of the ones listed below, " + 
                  "or select \"Other\" and specify your own licence");

        var licenceRadioFile = $("<input/>")
            .attr("name","licence radio")
            .attr("type","radio")
            .attr("id","licence-file-radio")
            .css("display","none")
            .val("file");

        var licenceFile = $("<input/>")
            .attr("name","licence file")
            .attr("id","licence-file")
            .css("display","none")
            .attr("type","file");

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

        var licenceRadioURL = $("<input/>")
            .attr("name","licence radio")
            .attr("type","radio")
            .attr("id","licence-url-radio")
            .css("display","none")
            .val("URL");

        var licenceURL = $("<input/>")
            .attr("name","licence url")
            .attr("id","licence-URL")
            .css("display","none")
            .attr("type","text");

        var licenceURLLabel = $("<label/>")
            .attr("for","licence-URL")
            .text("Provide a URL that links to your licence")
            .css("display","none");

        licenceDropdown.change(function() { //switch visibility on "Other" selection
            if($(this).val() === "Other") {
                licenceRadioFile.css("display","inline");
                licenceRadioURL.css("display","inline");
                licenceFileLabel.css("display","inline");
                licenceURLLabel.css("display","inline");
                licenceFile.css("display","block");
                licenceURL.css("display","block");
            } else {
                licenceRadioFile.css("display","none");
                licenceRadioURL.css("display","none");
                licenceFileLabel.css("display","none");
                licenceURLLabel.css("display","none");
                licenceFile.css("display","none");
                licenceURL.css("display","none");          
            }
        });

        licenceRadioFile.click(function() {
            licenceURL.prop("disabled",true);
            licenceFile.prop("disabled",false);
        });

        licenceRadioURL.click(function() {
            licenceURL.prop("disabled",false);
            licenceFile.prop("disabled",true);
        });

        licenceFile.click(function() {
            licenceRadioFile.click();
        });

        licenceURL.click(function() {
            licenceRadioURL.click();
        });

        licence.append(licenceLabel)
               .append(licenceDropdownLabel)
               .append(licenceDropdown)
               .append($("<br/>"))
               .append(licenceRadioFile)
               .append(licenceFileLabel)
               .append(licenceFile)
               .append(licenceRadioURL)
               .append(licenceURLLabel)
               .append(licenceURL);

        var repositoryLabel = $("<label/>") //TODO: it this the most sensible place to  put this? perhaps before upload?
            .attr("for","repository")
            .text("Repository: ");

        var repository = $("<select/>")
            .attr("name","repository")
            .attr("id","repository")
            .append($("<option/>").attr("value","").text(""));

        custom_contents.get_collections().then(function(response) {
            var collections = JSON.parse(response);
            collections.forEach(function(collection) {
                var collection_option = $("<option/>");
                collection_option.attr("value",collection.handle);
                collection_option.text(collection.name);
                repository.append(collection_option);
            });

            if(md_set) {
                repository.val(md.reportmetadata.repository);
            }
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

        var form2 = $("<fieldset/>").addClass("hide-me").attr("title","fields2").attr("id","fields2")
            .append(publisherLabel)
            .append(publisher)
            .append(citationsLabel)
            .append(citations)
            .append(referencedByLabel)
            .append(referencedBy_divs)
            //.append(fundersLabel)
            //.append(funders)
            //.append(sponsorsLabel)
            //.append(sponsors)
            .append(licenceLabel)
            .append(licence)
            .append(repositoryLabel)
            .append(repository);


        if(md_set) { //repopulate the form fields with previously saved data
            title.val(md.reportmetadata.title);
            var authorsarr = md.reportmetadata.authors;
            var deleteAuthor;
            authorsarr.forEach(function(item,index) {
                if(index === 0) {
                    defaultAuthorLastName.val(item[0]);
                    defaultAuthorFirstName.val(item[1]);
                    if(authorsarr.length > 1) {
                        deleteAuthor = $("<button/>")
                            .addClass("btn btn-xs btn-default remove-author-button")
                            .attr("type","button")
                            .attr("aria-label","Remove author")
                                .click(function() {
                                    auth[2].remove();
                                    $(this).remove();
                                }); //add a remove button to the previously last author

                        deleteAuthor.append($("<i>")
                                            .addClass("fa fa-trash")
                                            .attr("aria-hidden","true"));
                        defaultAuthor.append(deleteAuthor);
                    }
                    
                } else {
                    var auth = addAuthor();
                    auth[0].val(item[0]);
                    auth[1].val(item[1]);
                    if(index !== authorsarr.length - 1) { //if not last element
                        deleteAuthor = $("<button/>")
                            .addClass("btn btn-xs btn-default remove-author-button")
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
                            .addClass("btn btn-xs btn-default remove-citation-button") 
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
                            .addClass("btn btn-xs btn-default remove-citation-button")
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
                            .addClass("btn btn-xs btn-default remove-referencedBy-button") 
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
                            .addClass("btn btn-xs btn-default remove-referencedBy-button")
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
            licenceDropdown.val(md.reportmetadata.licence.preset);
            if(md.reportmetadata.licence.preset === "Other") {
                licenceURLLabel.css("display","inline");
                licenceFileLabel.css("display","inline");
                licenceRadioURL.css("display","inline");
                licenceRadioFile.css("display","inline");
                licenceURL.css("display","block");
                licenceFile.css("display","block");
            }
            licenceURL.val(md.reportmetadata.licence.url);
            if (licenceURL.val()) {
                licenceRadioURL.click();
            }
        }

        return {form1: form1, form2: form2};
    };

    var validate_fields1 = function() {
        $(".metadata-form-error").remove(); //clear errors

        if($("#title").val() === "") {
            var title_error = $("<div/>")
                .attr("id","title-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter a title");

            $("label[for=\"title\"]").after(title_error);
        }
        if($("#abstract").val() === "") {
            var abstract_error = $("<div/>")
                .attr("id","abstract-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter an abstract");

            $("label[for=\"abstract\"]").after(abstract_error);
        }
        var isInteger = function(str,greaterthan,lessthan) {
            var n = ~~Number(str); //convert into a number with no decimal part
            return String(n) === str && n > greaterthan && n < lessthan;
        };
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

    var validate_fields2 = function() {
        var md = Jupyter.notebook.metadata;
        $(".metadata-form-error").remove(); //clear errors

        if($("#repository").val() === "") {
            var repository_error = $("<div/>")
                .attr("id","repository-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a repository to deposit to");

            $("label[for=\"repository\"]").after(repository_error);
        }

        if($("#licence-dropdown").val() === "") {
            var licence_dropdown_error = $("<div/>")
                .attr("id","licence-dropdown-error")
                .addClass("metadata-form-error")
                .text("Please select a licence or select \"Other\" and specify your own.");

            $("label[for=\"licence\"]").after(licence_dropdown_error);
        } else if($("#licence-dropdown").val() === "Other" && 
                  !$("#licence-url-radio").prop("checked") &&
                  !$("#licence-file-radio").prop("checked"))
        {
            var no_licence_error = $("<div/>")
                .attr("id","no-licence-error")
                .addClass("metadata-form-error")
                .text("Please either provide a link to a licence or upload a licence file.");

            $("label[for=\"licence\"]").after(no_licence_error);
        } else if($("#licence-dropdown").val() === "Other" && 
                  $("#licence-URL").val() === "" &&
                  $("#licence-url-radio").prop("checked"))
        {
            var no_licence_url_error = $("<div/>")
                .attr("id","no-licence-url-error")
                .addClass("metadata-form-error")
                .text("Please provide a link to a licence file.");

            $("label[for=\"licence-URL\"]").after(no_licence_url_error);
        } else if($("#licence-dropdown").val() === "Other" && 
                  $("#licence-file").val() === "" &&
                  $("#licence-file-radio").prop("checked"))
        {
            var no_licence_file_error = $("<div/>")
                .attr("id","no-licence-url-error")
                .addClass("metadata-form-error")
                .text("Please upload a licence file.");

            $("label[for=\"licence-file\"]").after(no_licence_file_error);
        }

        $(".metadata-form-error").css("color", "red");

        if($(".metadata-form-error").length === 0) {
            md.reportmetadata = {};
            md.reportmetadata.title = $("#title").val();

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
            md.reportmetadata.abstract = $("#abstract").val();

            //Split our textarea by lines
            var split = $("#tags").val().split("\n");
            var lines = [];
            for (var i = 0; i < split.length; i++) {
                if (split[i]) { //make sure we don"t add any empty lines!
                    lines.push(split[i]);
                }
            }
            md.reportmetadata.tags = lines;

            var monthstring = "";
            if ($("#month").val() < 10) {
                //we need a leading zero to match DSpace"s date format
                monthstring = "0" + $("#month").val();
            } else {
                monthstring = $("#month").val();
            }
            if(monthstring === "00") { //if no month set it to just be the year
                md.reportmetadata.date = $("#year").val();
            } else if ($("#day").val() === "") { //month is set but day isn"t
                md.reportmetadata.date = $("#year").val() + "-" + monthstring;
            } else {
                md.reportmetadata.date = $("#year").val() + "-" + monthstring +
                                         "-" + $("#day").val();
            }

            md.reportmetadata.language = $("#language").val();
            md.reportmetadata.publisher = $("#publisher").val();

            md.reportmetadata.citations = [];
            $(".citation").each(function(i,e) {
                if($(e).val() !== "") {
                    md.reportmetadata.citations.push($(e).val());
                }
            });
            
            md.reportmetadata.referencedBy = [];
            $(".referencedBy").each(function(i,e) {
                if($(e).val() !== "") {
                    md.reportmetadata.referencedBy.push($(e).val());
                }
            });

            md.reportmetadata.funders = $("#funders").val();
            md.reportmetadata.sponsors = $("#sponsors").val();

            md.reportmetadata.licence = {
                "preset": $("#licence-dropdown").val(),
                "url": $("#licence-URL").val()
            };

            md.reportmetadata.repository = $("#repository").val();

            Jupyter.notebook.metadata = md;
            Jupyter.notebook.save_notebook();
            $("#collections_loaded").remove();
        }
    };

    var validate = function() {
        if(!$("#fields1").hasClass("hide-me") &&
           $("#fields2").hasClass("hide-me"))
        {
            validate_fields1();
            if($(".metadata-form-error").length === 0) {
                $("#fields1").addClass("hide-me");
                $("#fields2").removeClass("hide-me");
                $("#previous").removeClass("disabled");

                //we want button text to be save on the last page
                $("#next").text("Save");
            }
        }
        else if($("#fields1").hasClass("hide-me") &&
                !$("#fields2").hasClass("hide-me"))
        { //save our metadata
            validate_fields2();
            if($(".metadata-form-error").length === 0) {
                $(".modal").modal("hide");
            }
        }
    };
   

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
        validate: validate,
        validate_fields1: validate_fields1,
        validate_fields2: validate_fields2,
        create_fields: create_fields,
    };
});