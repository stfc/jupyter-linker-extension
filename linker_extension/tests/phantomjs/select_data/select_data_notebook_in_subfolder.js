

casper.notebook_test_at_location(function() {
	"use strict";

	casper.test.info("Testing selecting report metadata - notebook in subfolder");

    this.viewport(1024, 768);

    var nbname = "Untitled.ipynb";
    this.then( function () {
    	var name = this.evaluate(function() {
    		return Jupyter.notebook.notebook_name;
    	});
    	nbname = name;
    });

	//Click on menu item
    var selector = '#select_data > a';
    this.waitForSelector(selector);
    this.thenClick(selector);

    //We should redirect to tree view. Don't need to test as if this doesn't happen this will wait forever and trigger all the other tests to fail
    this.wait_for_dashboard();
    this.waitForSelector("#tree_extension_loaded");

    //tick the file and folder we are using to test
    this.then(function tick_then() {
    	var array = this.evaluate(function tick_eval() {
    		var filename = encodeURIComponent("sub ∂ir1") + "/" + encodeURIComponent('file_in_sub_∂ir1.txt');
    		var dirname = encodeURIComponent("sub ∂ir1") + "/" + encodeURIComponent('sub ∂ir 1a');
    		var arr = [];
    		$("a.item_link").map(function (i,a) {
                if (a.href.indexOf(filename) >= 0 || a.href.indexOf(dirname) >= 0) {
                    var parent = $(a).parent();
                    var checkbox = parent.children("input");
                    checkbox.click();
                }
            });
            $("a.item_link").each(function(i,a) {
            	if (a.href.indexOf(filename) >= 0 || a.href.indexOf(dirname) >= 0) {
            		var parent = $(a).parent();
                    var checkbox = parent.children("input");
                    if(checkbox.prop("checked")){
                    	arr.push($(a).children().html());
                    }
            	}
            });
            return arr;
    	});
    	
    	//check that everything shows up as being ticked
    	if(array.length === 0) {
    		this.test.assert(false,"tick array is empty!");
    	} else {
    		var check_arr = ["sub ∂ir 1a","file_in_sub_∂ir1.txt"];
	    	var that = this;
	    	check_arr.forEach(function(item) {
	    		if(array.indexOf(item) >= 0) {
	    			that.test.assert(true,item + " has been ticked");
	    		} else {
	    			that.test.assert(false,item + " hasn't been ticked");
	    		}
	    	});
    	}
    });

    //click the bundle button
    this.waitForSelector('.bundle-button');
    this.waitUntilVisible('.bundle-button');
    this.thenClick('.bundle-button');

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.waitForSelector(".bundled-file",null,null,5000);

    //check that our items are showing up in the dialog correctly
    this.then(function check_ticks_then() {
    	var arr = [];
    	arr = this.evaluate(function check_ticks_eval() {
    		var parent = $(".bundle-message").parent();
    		var children = parent.children("div");
            console.log(children);
    		var stuff = [];
    		children.each(function () {
    			if(this.id === "sub ∂ir1/sub ∂ir 1a") {
    				stuff.push("sub ∂ir 1a");
    				if($(this).children().eq(0).attr("id") === "sub ∂ir1/sub ∂ir 1a/file_in_sub_∂ir1a.txt") {
    					stuff.push("file_in_sub_∂ir1a.txt");
                    }
    			} if(this.id === "sub ∂ir1/file_in_sub_∂ir1.txt") {
    				stuff.push("file_in_sub_∂ir1.txt");
    			}
    		});
    		return stuff;
    	});
    	if(arr.length === 0) {
    		this.test.assert(false,"check tick array is empty!");
    	}
    	var check_arr = ["sub ∂ir 1a","file_in_sub_∂ir1a.txt","file_in_sub_∂ir1.txt"];
    	var that = this;
    	var check = 0;
    	check_arr.forEach(function(item) {
    		if(arr.indexOf(item) >= 0) {
    			that.test.assert(true,item + " is showing in the popup");
    			check++;
    		} else {
    			that.test.assert(false,item + " is not showing in the popup");
    		}
    	});
    	that.test.assertEquals(check,3,"All items showing up in the popup");
    });

    //click save
    this.thenClick('button.btn.btn-default.btn-sm.btn-primary');
    this.wait(300);

	//wait for the redirect    
	this.waitFor(this.page_loaded);
    this.waitFor(function() {
        return this.evaluate(function () {
            return Jupyter && Jupyter.notebook && true;
        });
    });

    //test the redirect
    this.then(function redirect_check() {
    	var url = this.evaluate(function document_url() {
    		return document.URL;
    	});
    	this.test.assertEquals(url,casper.cli.get("url") + "notebooks/sub%20%E2%88%82ir1/" + nbname,"Redirected back to our notebook correctly");
    });

    //test our files are actually in the metadata!
    this.then(function test_files_then() {
    	var metadata = this.evaluate(function test_files() {
    		var md = Jupyter.notebook.metadata;
    		if(!md.hasOwnProperty("databundle")) {
    			return {
    				exists: false,
    				databundle: [],
    			};
    		} else {
    			return {
    				exists: true,
    				databundle: md.databundle,
    			};
    		}
    	});
    	this.test.assert(metadata.exists,"Data bundle exists in metadata");
    	this.test.assertEquals(metadata.databundle[0].name,"sub ∂ir 1a","sub ∂ir 1a exists in metadata");
    	this.test.assertEquals(metadata.databundle[1].name,"file_in_sub_∂ir1.txt","file_in_sub_∂ir1.txt exists in metadata");
    	this.test.assertEquals(metadata.databundle[2].name,"file_in_sub_∂ir1a.txt","file_in_sub_∂ir1a.txt exists in metadata");

    });
},"sub ∂ir1");
