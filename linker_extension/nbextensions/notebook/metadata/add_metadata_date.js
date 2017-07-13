define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents"
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	var currtime = new Date();
	
	function date_field() {
		var date_div = $("<div/>");
	
	    var date = $("<table/>").attr("id","date");
	
	    var yearLabel = $("<label/>")
	        .attr("for","year")
	        .addClass("required")
	        .text("Issue Year: ")
	        .attr("id","year-label");
	    var year = $("<select/>").attr("name","year").attr("id","year")
                                 .append($("<option/>").attr("value","0").text("Not Set"))
        for (var i = currtime.getFullYear(); i >= 1970; i--) {
            choice = String.valueOf(i);
            year.append($("<option/>").attr("value",i).text(i));
        }
	
	    var monthLabel = $("<label/>")
	        .attr("for","month")
	        .text("Month: ")
	        .attr("id","month-label");
	    var month = $("<select/>").attr("name","month").attr("id","month")
	        .append($("<option/>").attr("value",0).text("Not Set"))
	        .append($("<option/>").attr("value",1).text("January"))
	        .append($("<option/>").attr("value",2).text("February"))
	        .append($("<option/>").attr("value",3).text("March"))
	        .append($("<option/>").attr("value",4).text("April"))
	        .append($("<option/>").attr("value",5).text("May"))
	        .append($("<option/>").attr("value",6).text("June"))
	        .append($("<option/>").attr("value",7).text("July"))
	        .append($("<option/>").attr("value",8).text("August"))
	        .append($("<option/>").attr("value",9).text("September"))
	        .append($("<option/>").attr("value",10).text("October"))
	        .append($("<option/>").attr("value",11).text("November"))
	        .append($("<option/>").attr("value",12).text("December"));
	
	    var dayLabel = $("<label/>")
	        .attr("for","day")
	        .text("Day: ")
	        .attr("id","day-label");
	    var day = $("<select/>").attr("name","day").attr("id","day")
                                .append($("<option/>").attr("value","0").text("Not Set"))
        for (var i = 1; i <= 31; i++) {
        	choice = String.valueOf(i);
        	day.append($("<option/>").attr("value",i).text(i));
        }
	
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
	    day.val(currtime.getDate());
	    month.val(currtime.getMonth() + 1);
	    year.val(currtime.getFullYear());

	    function set_to_today() {
	    	var currtime = new Date();
            day.val(currtime.getDate());
            month.val(currtime.getMonth() + 1);
            year.val(currtime.getFullYear());
	    }
	    
	    //fill the date fields with the default - now
	    var now_button = $("<button/>")
	        .text("Set to current date")
	        .attr("type","button")
	        .attr("id","current-date")
	        .addClass("btn btn-xs btn-default btn-date")
	        .click(set_to_today);

	    dateInputContainer.append(now_button);
	    
	    if (!md.reportmetadata.hasOwnProperty("date")) {
	    	set_to_today();
	    } else {
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
	    }
	    
	    

	    
	    date_div.append(date);
	    
	    return date_div;
	}
	
	function validate_date() {
        //checks to see if something is a valid date (including leap year stuff)
        var validDate = function(day,month,year) {
            var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            // Adjust for leap years
            if(year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                monthLength[1] = 29;
            }
            
            return day <= monthLength[month - 1];
        };
        
        console.log("Validating date: " + $("#year").val() + " " + $("#month").val() + " " + $("#day").val());

        if($("#year").val() == 0) {
            var no_year_error = $("<div/>")
                .attr("id","year-missing-error")
                .addClass("metadata-form-error")
                .text("Please enter at least the year of publication");

            $("#date").after(no_year_error);
        } else if($("#day").val() != 0 && $("#month").val() == 0) {
            var month_error = $("<div/>")
                .attr("id","month-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a month");

            $("#date").after(month_error);
        } else if($("#day").val() != 0 &&
                  !validDate($("#day").val(),$("#month").val(),$("#year").val()))
        {
            var day_error = $("<div/>")
                .attr("id","invalid-day-error")
                .addClass("metadata-form-error")
                .text("Please enter valid day");

            $("#date").after(day_error);
        }
	}
	
	var save_date_to_metadata = function() {
        var monthstring = "";
        if ($("#month").val() < 10) {
            //we need a leading zero to match DSpace's date format
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
	 }
	
    module.exports = {
        date_field: date_field,
        validate_date: validate_date,
        save_date_to_metadata: save_date_to_metadata
    };
});