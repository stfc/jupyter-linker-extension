define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,dialog,events) {
    "use strict";

    /*  
     *  Generate the reference toolbar.
     *  
     *  Jupyter provides the div of the toolbar and the associated cell,
     *  we just add all the required features.
     */ 
    var reference_url_toolbar = function(div, cell) {
    	//Container for help, toolbars
        var toolbar_container = $(div).addClass("cell-urls-container");
        toolbar_container.append("Add the reference URLs that relate to this cell:\n");
        
        //Create the URL container
        var URL_container = $("<div/>").addClass("cell-urls");
        toolbar_container.append(URL_container);
        
        //Create reference URLs list in cell metadata
        var metadata_set = cell.metadata.hasOwnProperty("referenceURLs");
        if(!metadata_set) {
        	console.log("Creating reference URL array")
            cell.metadata.referenceURLs = [];
        }
        
        //Create the add new URL button
        var add_url_button = $("<button/>")
    		.addClass("btn btn-xs btn-default add-cell-url-button")
    		.attr("type","button")
    		.bind("click", function(){create_referenceUrl(false)})
    		.attr("aria-label","Add reference URL")
        	.attr("id", "add_url_" + cell.cell_id);
        add_url_button.append($("<i>").addClass("fa fa-plus"));
        
        //If the metadata already exists, pre-populate the URL fields.
        if (metadata_set) {
        	populate_from_metadata();
        } else {
            //Create and setup the first reference URL
            create_referenceUrl(true);
        }
        
        function update_metadata() {
        	cell.metadata.referenceURLs = [];
            $(".referenceURL_" + cell.cell_id).each(function(i,e) {
                if($(e).val()) {
                    cell.metadata.referenceURLs.push($(e).val());
                }
            });
        }
        
        function create_referenceUrl(first) {
        	//Create a div to hold the input field and buttons.
            var reference_url_div = $("<div/>").addClass("referenceURL_div")
                                               .addClass("referenceURL_div_" + cell.cell_id);
            
            //Create and setup the input field.
            var reference_url = $("<input/>").addClass("referenceURL referenceURL_" + cell.cell_id)
                                             .attr("name","referenceURL");
            
            if (first) {
            	reference_url.attr("id", "referenceURL_" + cell.cell_id + "_0");
            }
            
            reference_url_div.append(reference_url);
            
           //On focus, allow keyboard editing of the URL.
            reference_url.focus(function() {
                Jupyter.keyboard_manager.edit_mode();
            });
            
            //When the URL changes, update the cell's metadata.
            reference_url.change(function() {
                update_metadata();
            });

            if (!first) {
            	var div = $(".referenceURL_div_" + cell.cell_id).last();
            	add_delete_button(div);
            }

            //Attach the add URL button to the latest URL.
            reference_url_div.append(add_url_button);

            URL_container.append(reference_url_div);
            
            update_ids();
            
            return([reference_url, reference_url_div]);
        }    
        
        
        function update_ids() {
            $(".referenceURL_" + cell.cell_id).each(function(i,e) {
                $(e).attr("id", "referenceURL_" + cell.cell_id + "_" + i);
            });
        }
        
        function add_delete_button(div) {
        	//Detach the add url button, and add a delete button to the previous URL.       	
        	add_url_button.detach();
        	
        	console.log("Found div: " + div.attr("class"));
        	
            var delete_button = $("<button/>")
                .addClass("btn btn-xs btn-default remove-cell-url-button")
                .attr("type","button")
                .attr("aria-label","Remove reference URL")
                .click(function() {
                    div.remove();
                    $(this).remove();
                    update_metadata();
                    update_ids();
                });

            delete_button.append($("<i>")
                             .addClass("fa fa-trash")
                             .attr("aria-hidden","true"));
            div.append(delete_button);
        }

        function populate_from_metadata() {
        	console.log("Populating URL array from metadata")
            var URLarray = cell.metadata.referenceURLs;
        	var url_pair = create_referenceUrl(true);
        	var base_url = url_pair[0];
        	var base_url_div = url_pair[1];
            URLarray.forEach(function(item,index) {
            	var reference_url = base_url;
            	var reference_url_div = base_url_div;
            	if (index != 0) {
            		var reference_pair = create_referenceUrl(false);
            		reference_url = reference_pair[0];
            		reference_url_div = reference_pair[1];
            		reference_url.attr("id", "referenceURL_" + cell.cell_id + "_" + index);
            	}
            	console.log("Found URL: " + item);
            	reference_url.val(item);
            	
            	if (index != URLarray.length - 1) {
            		add_delete_button(reference_url_div);
            	}
            });
        }
    };

    module.exports = {reference_url_toolbar: reference_url_toolbar};
});