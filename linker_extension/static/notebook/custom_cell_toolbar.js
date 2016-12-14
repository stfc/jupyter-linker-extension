define(['base/js/namespace','notebook/js/celltoolbar','base/js/dialog','base/js/events'], function(Jupyter,celltoolbar,dialog,events) {
	"use strict";


    var load = function() {
    	var CellToolbar = celltoolbar.CellToolbar;

		CellToolbar.prototype._rebuild = CellToolbar.prototype.rebuild;
	    CellToolbar.prototype.rebuild = function () {
	        events.trigger('toolbar_rebuild.CellToolbar', this.cell);
	        this._rebuild();
		};

		CellToolbar._global_hide = CellToolbar.global_hide;
	    CellToolbar.global_hide = function () {
	        CellToolbar._global_hide();
	        for (var i=0; i < CellToolbar._instances.length; i++) {
	            events.trigger('global_hide.CellToolbar', CellToolbar._instances[i].cell);
	        }
		};

		var example_preset = [];

		CellToolbar.register_callback('linker_extension.add_reference_url',add_reference_url);
	    example_preset.push('linker_extension.add_reference_url');

	    CellToolbar.register_preset('Linker Extension',example_preset, Jupyter.notebook);

	    var action = {
	        help: 'Show/hide the cell references bar on all the cells ',
	        help_index: 'g',
	        icon: 'fa-eye',
	        handler : toggle_cell_references_bar,
	    };

	    var prefix = "linker_extension";
	    var action_name = "toggle-cell-references-bar";
	    var full_action_name = Jupyter.actions.register(action,action_name,prefix);

        $('#toggle_cell_references_bar').click(function () {
	        toggle_cell_references_bar(); //todo: username storage? or we can probably get rid of this button
	    });
    };

    var toggle_cell_references_bar = function() {
    	var CellToolbar = celltoolbar.CellToolbar;
    	if(Jupyter.notebook.metadata.celltoolbar !== "Linker Extension") {
    		CellToolbar.global_show();

    		CellToolbar.activate_preset("Linker Extension");
    		Jupyter.notebook.metadata.celltoolbar = "Linker Extension";

    		$('#toggle_cell_references_bar > a').text("Hide cell references bar");
    	} else {
    		CellToolbar.global_hide();
    		delete Jupyter.notebook.metadata.celltoolbar;
    		$('#toggle_cell_references_bar > a').text("Show cell references bar");
    	}
    };

    var add_reference_url = function(div, cell) {
        var help_text = "Add the reference URLs that relate to this cell:\n";
        var toolbar_container = $(div).addClass("cell-urls-container");

        var URL_container = $('<div/>').addClass("cell-urls");
        toolbar_container.append(help_text);
        toolbar_container.append(URL_container);

        var md_set = cell.metadata.hasOwnProperty("referenceURLs");
        if(!md_set) {
        	cell.metadata.referenceURLs = [];
        }

        var base_referenceURL = $('<input/>').addClass("referenceURL referenceURL_" + cell.cell_id).attr('name','referenceURL');

	   	var base_referenceURL_div = $('<div/>').addClass("referenceURL_div").addClass("referenceURL_div_" + cell.cell_id);
        base_referenceURL_div.append(base_referenceURL);
        var addURLButton = $('<button/>')
            .addClass('btn btn-xs btn-default add-cell-url-button')
            .attr('type','button')
            .bind("click",addURL)
            .attr("aria-label","Add reference URL");

        addURLButton.append($('<i>').addClass("fa fa-plus"));
        base_referenceURL_div.append(addURLButton);

        URL_container.append(base_referenceURL_div);

        base_referenceURL.focus(function() { //on focus switch into edit mode so we can type text normally
        	Jupyter.keyboard_manager.edit_mode();
        });

        function update_metadata() {
        	cell.metadata.referenceURLs = [];
        	$(".referenceURL_" + cell.cell_id).each(function(i,e) {
        		if($(e).val()) {
        			cell.metadata.referenceURLs.push($(e).val());
	        	}
        	});
        }

        base_referenceURL.change(function() { //save all values to metadata on change
        	update_metadata();
        });

        if(md_set) {
	        var URLarr = cell.metadata.referenceURLs;
	        var deleteURL;
	        URLarr.forEach(function(item,index) {
	            if(index === 0) {
	                base_referenceURL.val(item);
	                if(URLarr.length > 1) {
	                    deleteURL = $('<button/>') //need to manually add delete button since addAuthor relies on finding
	                        .addClass('btn btn-xs btn-default remove-cell-url-button') //is still being created I think...
	                        .attr('type','button')
	                        .attr("aria-label","Remove reference URL")
	                            .click(function() {
	                            	base_referenceURL.remove();
	                                $(this).remove();

	                            	update_metadata();
	                            });
	                    deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
	                    base_referenceURL_div.append(deleteURL);
	                }
	                
	            } else {
	                var URL = addURL();
	                URL[0].val(item);
	                if(index !== URLarr.length - 1) { //if not last element
	                    deleteURL = $('<button/>')
	                        .addClass('btn btn-xs btn-default remove-cell-url-button')
	                        .attr('type','button')
	                        .attr("aria-label","Remove reference URL")
	                            .click(function() {
	                            	URL[1].remove();
	                                $(this).remove();

	                            	update_metadata();
	                            });
	                    deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
	                    URL[1].append(deleteURL);
	                }
	            }
	        });
        }

        function addURL() {
	    	var newURL = ($('<div/>')).addClass("referenceURL_div").addClass("referenceURL_div_" + cell.cell_id);
	        var URL = $('<input/>')
	            .attr('class','referenceURL referenceURL_' + cell.cell_id)
	            .attr('type','text')
	            .attr("name","referenceURL");

            URL.focus(function() { //on focus switch into edit mode so we can type text normally
	        	Jupyter.keyboard_manager.edit_mode();
	        });

	        URL.change(function() { //saveall values to metadata on change
	        	update_metadata();
	        });

	        var previousURL = $('.referenceURL_div_' + cell.cell_id).last();
	        addURLButton.detach(); //detach from the previously last url input so we can put it back on the new one
	        var deleteURL = $('<button/>')
	            .addClass('btn btn-xs btn-default remove-cell-url-button')
	            .attr('type','button')
	            .attr("aria-label","Remove reference URL")
	                .click(function() {
	                    previousURL.remove();
	                    $(this).remove();
	                    update_metadata();
	                }); //add a remove button to the previously last url

	        deleteURL.append($('<i>').addClass("fa fa-trash").attr("aria-hidden","true"));
	        previousURL.append(deleteURL);
	        URL_container.append(newURL.append(URL).append(addURLButton));
	        return [URL,newURL];
	    }
    };


    module.exports = {load: load};
});