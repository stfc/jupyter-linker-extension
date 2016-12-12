define(['base/js/namespace','base/js/utils','base/js/dialog','../custom_contents','./modify_notebook_html'],function(Jupyter,utils,dialog,custom_contents){

    var add_metadata = function () {

        var form_fields = create_fields();

        var form_body = $('<div/>').attr('title', 'Add the metadata')
            .append(
                $('<form id="add_metadata_form"/>').append(
                        $('<label/>')
                        .attr('for','add_metadata_form')
                        .text("Add the metadata for the notebook."))
                        .append(form_fields.form1)
                        .append(form_fields.form2)
            );
        
        var modal = dialog.modal({
            title: "Add " + Jupyter.notebook.notebook_name + " Metadata",
            body: form_body,
            buttons: {
                Cancel: {},
                Previous: { click: function() {
                                if(!$("#fields1").hasClass("hide-me") && $("#fields2").hasClass("hide-me")) { //make a multi page form by changing visibility of the forms
                                    $("#previous").addClass("disabled"); //can't go back when we're on the first page
                                }
                                else if($("#fields1").hasClass("hide-me") && !$("#fields2").hasClass("hide-me")) {
                                    $("#fields2").addClass("hide-me");
                                    $("#fields1").removeClass("hide-me");
                                    $("#next").text("Next"); //we want next to be next on any page but the last one
                                }
                            }
                },
                Next: { class : "btn-primary",
                        click: function() {
                            validate();
                    },
                }
            },
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager,
        });

		modal.on("shown.bs.modal", function () {
            $(".modal-footer > button.btn-sm").eq(1).removeAttr("data-dismiss").attr("id","previous");
			$(".modal-footer > button.btn-sm").eq(2).removeAttr("data-dismiss").attr("id","next");
        });
		

        
    };

    var create_fields = function () {
        var md = Jupyter.notebook.metadata;
        var md_set = false;
        var contents = Jupyter.notebook.contents;
        var authorcount = 1;

        var return_fields = {};

        if(md.hasOwnProperty("reportmetadata")) { //check to see if metadata has previously been set and whether we need to repopulate the form fields
            md_set = true;
        }

        var title = $('<input/>')
            .attr('name','title')
            .attr('id','title')
            .attr('type','text')
            .val("");

        return_fields.title = title;

        var titleLabel =  $('<label/>')
            .attr('for','title')
            .text("Title: ");

        var defaultAuthorFirstName = $('<input/>')
            .attr('class','author-first-name')
            .attr('type','text')
            .attr('id','author-first-name-0')
            .on("keydown", function(event) {
                if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active ) {
                  event.preventDefault();
                }
            })
            .autocomplete({
                source: function( request, response ) {
                    var ldap_list = null;
                    var url = Jupyter.notebook.contents.base_url + 'ldap';
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
                    $.ajax(url + '?' + $.param({"firstname": request.term, "lastname": $('#author-last-name-0').val()}),settings);
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

        var defaultAuthorLastName = $('<input/>')
            .attr('class','author-last-name')
            .attr('type','text')
            .attr('id','author-last-name-0')
            .on("keydown", function(event) {
                if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active ) {
                  event.preventDefault();
                }
            })
            .autocomplete({
                source: function( request, response ) {
                    var ldap_list = null;
                    var url = Jupyter.notebook.contents.base_url + 'ldap';
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
                    $.ajax(url + '?' + $.param({"lastname": request.term, "firstname": $('#author-first-name-0').val()}),settings);
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

        var authorsLabel = $('<label/>')
            .attr('for','author')
            .text("Authors: ");

        var authorsFirstNameLabel = $('<label/>')
            .attr('for','defaultAuthorFirstName')
            .text("First name(s), e.g. John: ");

        var authorsLastNameLabel = $('<label/>')
            .attr('for','defaultAuthorLastName')
            .text("Last name, e.g. Smith: ");

        var defaultAuthor = ($('<div/>'))
            .addClass('author')
            .append(defaultAuthorLastName)
            .append(defaultAuthorFirstName);

        var authors = $('<div/>').attr('id','authors')
            .append(authorsLastNameLabel)
            .append(authorsFirstNameLabel)
            .append(defaultAuthor);

        var addAuthorButton = $('<button/>')
            .addClass('btn btn-xs btn-default')
            .attr('id','add-author-button')
            .attr('type','button')
            .attr('aria-label','Add author')
            .bind("click",addAuthor);

        addAuthorButton.append($('<i>').addClass("fa fa-plus").attr("aria-hidden","true"));
        defaultAuthor.append(addAuthorButton);

        function addAuthor() {
                var newAuthor = ($('<div/>'));
                var currcount = authorcount;
                var lastName = $('<input/>')
                    .attr('class','author-last-name')
                    .attr('type','text')
                    .attr('id','author-last-name-' + authorcount)
                    .on("keydown", function(event) {
                        if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active ) {
                          event.preventDefault();
                        }
                    })
                    .autocomplete({
                        source: function( request, response ) {
                            var ldap_list = null;
                            var url = Jupyter.notebook.contents.base_url + 'ldap';
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
                            $.ajax(url + '?' + $.param({"lastname": request.term, "firstname": $('#author-first-name-' + currcount).val()}),settings);
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
                var firstName = $('<input/>')
                    .attr('class','author-first-name')
                    .attr('type','text')
                    .attr('id','author-first-name-' + authorcount)
                    .on("keydown", function(event) {
                        if (event.keyCode === $.ui.keyCode.TAB && $( this ).autocomplete( "instance" ).menu.active ) {
                          event.preventDefault();
                        }
                    })
                    .autocomplete({
                        source: function( request, response ) {
                            var ldap_list = null;
                            var url = Jupyter.notebook.contents.base_url + 'ldap';
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
                            $.ajax(url + '?' + $.param({"firstname": request.term, "lastname": $('#author-last-name-' + currcount).val()}),settings);
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
                newAuthor.addClass('author')
                    .append(lastName)
                    .append(firstName);
                var previousAuthor = $('.author').last();
                addAuthorButton.detach(); //detach from the previously last author input so we can put it back on the new one
                var deleteAuthor = $('<button/>')
                    .addClass('btn btn-xs btn-default remove-author-button')
                    .attr('type','button')
                    .attr("aria-label","Remove author")
                        .click(function() {
                            previousAuthor.remove();
                            $(this).remove();
                        }); //add a remove button to the previously last author

                deleteAuthor.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
                previousAuthor.append(deleteAuthor);
                authors.append(newAuthor.append(addAuthorButton));
                authorcount++;
                return [lastName,firstName,newAuthor];
            }

        var abstractLabel = $('<label/>')
            .attr('for','abstract')
            .text("Abstract: ");

        var abstract = $('<textarea/>').attr('name','abstract').attr('id','abstract');


        var tagsLabel = $('<label/>')
            .attr('for','tags')
            .text("Tags: ");

        var tags = $('<textarea/>').attr('name','tags').attr("id","tags");

        var dateLabel = $('<label/>')
            .attr('for','date')
            .text("Date: ");

        var date = $('<table/>').attr('id','date');

        var yearLabel = $('<label/>')
            .attr('for','year')
            .text("Year: ")
            .attr("id","year-label");
        var year = $('<input/>').attr('name','year').attr('id','year');

        var monthLabel = $('<label/>')
            .attr('for','month')
            .text("Month: ")
            .attr("id","month-label");
        var month = $('<select/>').attr('name','month').attr('id','month')
            .append($('<option/>').attr("value","0").text(""))
            .append($('<option/>').attr("value","1").text("January"))
            .append($('<option/>').attr("value","2").text("February"))
            .append($('<option/>').attr("value","3").text("March"))
            .append($('<option/>').attr("value","4").text("April"))
            .append($('<option/>').attr("value","5").text("May"))
            .append($('<option/>').attr("value","6").text("June"))
            .append($('<option/>').attr("value","7").text("July"))
            .append($('<option/>').attr("value","8").text("August"))
            .append($('<option/>').attr("value","9").text("September"))
            .append($('<option/>').attr("value","10").text("October"))
            .append($('<option/>').attr("value","11").text("November"))
            .append($('<option/>').attr("value","12").text("December"));

        var dayLabel = $('<label/>')
            .attr('for','day')
            .text("Day: ")
            .attr("id","day-label");
        var day = $('<input/>').attr('name','day').attr('id','day');

        var dateLabelContainer = $('<tr/>').attr('id','date-label-container');
        var dateInputContainer = $('<tr/>').attr('id','date-input-container');

        dateLabelContainer.append($('<td>').append(yearLabel)).append($('<td>').append(monthLabel)).append($('<td>').append(dayLabel));
        dateInputContainer.append($('<td>').append(year)).append($('<td>').append(month)).append($('<td>').append(day));

        date.append(dateLabelContainer).append(dateInputContainer);

        //TODO: Ask about type - surely it will have to be collection for now?


        var languageLabel = $('<label/>')
            .attr('for','language')
            .text("Language: ");

        var language = $('<select/>')
            .attr('name','language')
            .attr('id','language')
            .append($('<option/>').attr("value","").text("n/A"))
            .append($('<option/>').attr("value","en_US").text("English (US)"))
            .append($('<option/>').attr("value","en").text("English"))
            .append($('<option/>').attr("value","es").text("Spanish"))
            .append($('<option/>').attr("value","de").text("German"))
            .append($('<option/>').attr("value","fr").text("French"))
            .append($('<option/>').attr("value","it").text("Italian"))
            .append($('<option/>').attr("value","ja").text("Japanese"))
            .append($('<option/>').attr("value","zh").text("Chinese"))
            .append($('<option/>').attr("value","tr").text("Turkish"))
            .append($('<option/>').attr("value","other").text("Other"));

        var form1 = $('<fieldset/>').attr('title','fields1').attr('id','fields1')
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

        var publisherLabel = $('<label/>')
            .attr('for','publisher')
            .text("Publisher: ");

        var publisher = $('<input/>').attr('name','publisher').attr('id','publisher');

        var citationLabel = $('<label/>')
            .attr('for','citation')
            .text("Citation: ");

        var citation = $('<input/>').attr('name','citation').attr('id','citation');

        var referencedByLabel = $('<label/>')
            .attr('for','referencedBy')
            .text("Related publication persistent URL: ");

        var referencedBy = $('<input/>').addClass("referencedBy").attr('name','referencedBy').attr('id','referencedBy-0');

        var referencedBy_div = $('<div/>').addClass("referencedBy_div");

        var referencedBy_divs = $('<div/>');

        var addURLButton = $('<button/>')
            .addClass('btn btn-xs btn-default')
            .attr('id','add-url-button')
            .attr('type','button')
            .bind("click",addURL)
            .attr("aria-label","Add referenced By URL");

        addURLButton.append($('<i>').addClass("fa fa-plus"));

        referencedBy_div.append(referencedBy);
        referencedBy_div.append(addURLButton);

        referencedBy_divs.append(referencedBy_div);

        var urlcount = 1;

        function addURL() {
            var newURL = ($('<div/>')).addClass("referencedBy_div");
            var currcount = urlcount;
            var URL = $('<input/>')
                .attr('class','referencedBy')
                .attr('type','text')
                .attr('id','referencedBy-' + urlcount);

            var previousURL = $('.referencedBy_div').last();
            addURLButton.detach(); //detach from the previously last url input so we can put it back on the new one
            var deleteURL = $('<button/>')
                .addClass('btn btn-xs btn-default remove-url-button')
                .attr('type','button')
                .attr("aria-label","Remove referenced By URL")
                    .click(function() {
                        previousURL.remove();
                        $(this).remove();
                    }); //add a remove button to the previously last url

            deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
            previousURL.append(deleteURL);
            referencedBy_divs.append(newURL.append(URL).append(addURLButton));
            urlcount++;

            return [URL,newURL];
        }

        var fundersLabel = $('<label/>')
            .attr('for','funders')
            .text("Funders: ");

        var funders = $('<input/>').attr('name','funders').attr('id','funders');         

        var sponsorsLabel = $('<label/>')
            .attr('for','sponsors')
            .text("Sponsors: ");

        var sponsors = $('<textarea/>').attr('name','sponsors').attr('id','sponsors');

        var repositoryLabel = $('<label/>') //TODO: it this the most sensible place to  put this? perhaps before upload?
            .attr('for','repository')
            .text("Repository: ");

        var repository = $('<select/>')
            .attr('name','repository')
            .attr('id','repository')
            .append($('<option/>').attr("value","").text(""));

        custom_contents.sword_get_servicedocument().catch(function(reason) {
            var xml = $.parseXML(reason.xhr.responseText);
            var collections = $(xml).find("app\\:collection");
            collections.each(function(index, item) {
                var last_slash = $(item).attr("href").lastIndexOf("/");
                var collection_id = $(item).attr("href").slice(last_slash + 1);

                var collection_name = $(item).find("atom\\:title").get(0);

                var collection_option = $('<option/>');
                collection_option.attr("value",collection_id);
                collection_option.text(collection_name.textContent);
                repository.append(collection_option);
            });

            if(md_set) {
                repository.val(md.reportmetadata.repository);
            }
            $(document.body).append($("<div/>").attr("id","collections_loaded"));
        });

        

        var form2 = $('<fieldset/>').addClass("hide-me").attr('title','fields2').attr('id','fields2')
            .append(publisherLabel)
            .append(publisher)
            .append(citationLabel)
            .append(citation)
            .append(referencedByLabel)
            .append(referencedBy_divs)
            .append(fundersLabel)
            .append(funders)
            .append(sponsorsLabel)
            .append(sponsors)
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
                        deleteAuthor = $('<button/>')
                            .addClass('btn btn-xs btn-default remove-author-button')
                            .attr('type','button')
                            .attr("aria-label","Remove author")
                                .click(function() {
                                    auth[2].remove();
                                    $(this).remove();
                                }); //add a remove button to the previously last author

                        deleteAuthor.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
                        defaultAuthor.append(deleteAuthor);
                    }
                    
                } else {
                    var auth = addAuthor();
                    auth[0].val(item[0]);
                    auth[1].val(item[1]);
                    if(index !== authorsarr.length - 1) { //if not last element
                        deleteAuthor = $('<button/>')
                            .addClass('btn btn-xs btn-default remove-author-button')
                            .attr('type','button')
                            .attr("aria-label","Remove author")
                                .click(function() {
                                    auth[2].remove();
                                    $(this).remove();
                                }); //add a remove button to the previously last author

                        deleteAuthor.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
                        auth[2].append(deleteAuthor);
                    }
                    //TODO: make this nicer? make it so I don't have to manually add the delete?
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
                if(datearr[1].charAt(0) === '0') {
                    //leading 0, so only take last character
                    datearr[1] = datearr[1].charAt(1);
                }
                month.val(datearr[1]);
                day.val(datearr[2]);
            }

            language.val(md.reportmetadata.language);
            publisher.val(md.reportmetadata.publisher);
            citation.val(md.reportmetadata.citation);

            var URLarr = md.reportmetadata.referencedBy;
            var deleteURL;
            URLarr.forEach(function(item,index) {
                if(index === 0) {
                    referencedBy.val(item);
                    if(URLarr.length > 1) {
                        deleteURL = $('<button/>') //need to manually add delete button since addAuthor relies on finding the previous author
                            .addClass('btn btn-xs btn-default remove-url-button') //using selectors, which don't work here since the modal is still being created I think...
                            .attr('type','button')
                            .attr("aria-label","Remove referenced By URL")
                                .click(function() {
                                    referencedBy.remove();
                                    $(this).remove();
                                });
                        deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
                        referencedBy_div.append(deleteURL);
                    }
                    
                } else {
                    var URL = addURL();
                    URL[0].val(item);
                    if(index !== URLarr.length - 1) { //if not last element
                        deleteURL = $('<button/>')
                            .addClass('btn btn-xs btn-default')
                            .attr('id','remove-url-button')
                            .attr('type','button')
                            .attr("aria-label","Remove referenced By URL")
                                .click(function() {
                                    URL[1].remove();
                                    $(this).remove();
                                });
                        deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
                        URL[1].append(deleteURL);
                    }
                }
            });

            funders.val(md.reportmetadata.funders);
            sponsors.val(md.reportmetadata.sponsors);
        }

        return {form1: form1, form2: form2};
    };

    var validate_fields1 = function() {
        var md = Jupyter.notebook.metadata;
        $('.metadata-form-error').remove(); //clear errors

        if($("#title").val() === "") {
            $("label[for='title']").after($("<div/>").addClass("metadata-form-error").text("Please enter a title"));
        }
        if($("#abstract").val() === "") {
            $("label[for='abstract']").after($("<div/>").addClass("metadata-form-error").text("Please enter an abstract"));
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

            var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
            // Adjust for leap years
            if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                monthLength[1] = 29;
            }
            return day > 0 && day <= monthLength[month - 1];
        };
        if($("#year").val() === "") { //date checking. else ifs because previous errors affect later errors (e.g. invalid year affects day validity etc)
            $("label[for='date']").after($("<div/>").addClass("metadata-form-error").text("Please enter at least the year of publication"));
        } else if(!isInteger($("#year").val(),1800,3000)) {
            $("label[for='date']").after($("<div/>").addClass("metadata-form-error").text("Please enter a valid year"));
        } else if($("#day").val() !== "" && $("#month").val() === "0") {
            $("label[for='date']").after($("<div/>").addClass("metadata-form-error").text("Please select a month"));
        } else if($("#day").val() !== "" && !validDate($("#day").val(),$("#month").val(),$("#year").val())) {
            $("label[for='date']").after($("<div/>").addClass("metadata-form-error").text("Please enter valid day"));
        }
        $('.metadata-form-error').css('color', 'red');
    };

    var validate_fields2 = function() {
        var md = Jupyter.notebook.metadata;
        $('.metadata-form-error').remove(); //clear errors

        if($("#repository").val() === "") {
            $("label[for='repository']").after($("<div/>").addClass("metadata-form-error").text("Please select a repository to deposit to"));
        }

        $('.metadata-form-error').css('color', 'red');

        if($(".metadata-form-error").length === 0) {
            md.reportmetadata = {};
            md.reportmetadata.title = $("#title").val();

            md.reportmetadata.authors = [];
            $('.author').each(function(i,e) {
                var authorarr = [];
                var ln = $(e).children('.author-last-name').val();
                var fn = $(e).children('.author-first-name').val();
                if(ln !== "" || fn !== "") {
                    authorarr.push(ln);
                    authorarr.push(fn);
                    md.reportmetadata.authors.push(authorarr);
                }
            });
            md.reportmetadata.abstract = $("#abstract").val();

            //Split our textarea by lines
            var split = $("#tags").val().split('\n');
            var lines = [];
            for (var i = 0; i < split.length; i++) {
                if (split[i]) {
                    lines.push(split[i]); //make sure we don't add any empty lines!
                }
            }
            md.reportmetadata.tags = lines;

            var monthstring = "";
            if ($("#month").val() < 10) {
                monthstring = "0" + $("#month").val(); //we need a leading zero for DSpace
            } else {
                monthstring = $("#month").val();
            }
            if(monthstring === "00") { //if no month set it to just be the year
                md.reportmetadata.date = $("#year").val();
            } else if ($("#day").val() === "") { //month is set but day isn't
                md.reportmetadata.date = $("#year").val() + "-" + monthstring;
            } else {
                md.reportmetadata.date = $("#year").val() + "-" + monthstring + "-" + $("#day").val();
            }

            md.reportmetadata.language = $("#language").val();
            md.reportmetadata.publisher = $("#publisher").val();
            md.reportmetadata.citation = $("#citation").val();
            
            md.reportmetadata.referencedBy = [];
            $('.referencedBy').each(function(i,e) {
                md.reportmetadata.referencedBy.push($(e).val());
            });

            md.reportmetadata.funders = $("#funders").val();
            md.reportmetadata.sponsors = $("#sponsors").val();

            md.reportmetadata.repository = $("#repository").val();

            Jupyter.notebook.metadata = md;
            Jupyter.notebook.save_notebook();
            $("#collections_loaded").remove();
        }
    };

    var validate = function() {
        if(!$("#fields1").hasClass("hide-me") && $("#fields2").hasClass("hide-me")) {
            validate_fields1();
            if($(".metadata-form-error").length === 0) {
                $("#fields1").addClass("hide-me");
                $("#fields2").removeClass("hide-me");
                $("#previous").removeClass("disabled");
                $("#next").text("Save"); //we want next to be save on the last page
            }
        }
        else if($("#fields1").hasClass("hide-me") && !$("#fields2").hasClass("hide-me")) { //save our metadata
            validate_fields2();
            if($(".metadata-form-error").length === 0) {
                $(".modal").modal("hide");
            }
        }
    };
   

    var action = {
        help: 'Add notebook metadata',
        help_index: 'a',
        icon: 'fa-bars',
        handler : add_metadata,
    };

    var prefix = "linker_extension";
    var action_name = "add-notebook-metadata";
    var full_action_name = Jupyter.actions.register(action,action_name,prefix);

    var load = function () {
        $('#add_metadata').click(function () {
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