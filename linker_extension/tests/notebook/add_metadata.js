

//MUST BE RUN USING SLIMERJS AS PHANTOMJS DOES NOT SUPPORT XML PARSING
casper.notebook_test(function() {
    "use strict";

    casper.test.info("Testing adding report metadata");

    this.viewport(1024, 768);

    //Click on menu item
    var selector = '#add_metadata > a';
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that certain fields are required 
    this.waitForSelector('#next');
    this.thenClick('#next');

    this.then(function() {
        this.test.assertExists("#title-missing-error","Title missing error exists");
        this.test.assertExists("#abstract-missing-error","Abstract missing error exists");
        this.test.assertExists("#year-missing-error","Year missing error exists");
    });

    //testing the date validation
    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '4000',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#invalid-year-error","Upper bound on year limit working");
    });


    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '1000',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#invalid-year-error","Lower bound on year limit working");
    });

    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '2000',
            'day': '31',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#month-missing-error","Month missing error exists");
    });

    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '2000',
            'month': '2',
            'day': '31',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#invalid-day-error","Date logic working for rejecting invalid combos");
    });

    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '1900', //not a leap year
            'month': '2',
            'day': '29',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#invalid-day-error","Leap year logic working for rejecting invalid combos");
    });

    this.then(function() {
        this.fill('form#add_metadata_form > fieldset#fields1', {
            'title': "My Title",
            'abstract': "My abstract",
            'year': '2000', //is a leap year!
            'month': '2',
            'day': '29',
        });
    });
    this.thenClick('#next');
    this.then(function() {
        this.test.assertVisible("#fields2","Leap year logic working for accepting valid combos");
    });

    this.thenClick('#previous');
    this.waitForSelector('#add-author-button');
    this.thenClick("#add-author-button");
    this.thenClick("#add-author-button"); //create two extra author fields - we'll end up leaving one blank

    //Add some test metadata
    this.then(function() {
        this.fillSelectors('form#add_metadata_form > fieldset#fields1', { //need to use fill selectors to fill in the authors
            '#title': "My Title",
            '#abstract': "My abstract",
            '#year': '1995',
            '#month': '8',
            '#day': '20',
            '#language': 'en',
            '#tags': 'tag1\ntag2',
            '#author-last-name-0': 'Davies',
            '#author-first-name-0': 'Louise',
            '#author-last-name-2': "S'chn T'gai",
            '#author-first-name-2': 'Spock',
        });
    }); 
    this.thenClick('#next');
    this.then(function() {
        this.test.assertVisible("#fields2","Valid data has been accepted");
    });

    this.waitForSelector("#collections_loaded"); //feels dirty...

    this.thenClick('#next');
    this.then(function() {
        this.test.assertExists("#repository-missing-error","Repository missing error exists");
    });

    this.waitForSelector("#add-url-button");
    this.thenClick("#add-url-button");
    this.thenClick("#add-url-button"); //again, create two extra boxes but we'll only use one

    this.then(function() {
        this.fillSelectors('form#add_metadata_form > fieldset#fields2', { //need to use fillSelectors for the referencedBy urls
            '#publisher': 'test publisher',
            '#citation': 'test citation',
            '#referencedBy-0': "URL1",
            '#referencedBy-2': "URL2",
            '#repository': "edata/8" //the handle for SCD
        });
    }); //TODO: add funders and sponsors if we can use them
    this.thenClick('#next');
    this.wait(300);

    //Should be within notebook metadata now.     
    this.then(function() {
        var that = this;
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    title: "",
                    abstract: "",
                    date:"",
                    language: '',
                    tags: [],
                    authors: [],
                    publisher: '',
                    citation: '',
                    referencedBy: [],
                    repository: ""
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    language: md.reportmetadata.language,
                    tags: md.reportmetadata.tags,
                    authors: md.reportmetadata.authors,
                    publisher: md.reportmetadata.publisher,
                    citation: md.reportmetadata.citation,
                    referencedBy: md.reportmetadata.referencedBy,
                    repository: md.reportmetadata.repository,
                };
            }
            
        });
        this.test.assertEquals(metadata.title,"My Title","Title has been set correctly");
        this.test.assertEquals(metadata.abstract,"My abstract","Abstract has been set correctly");
        this.test.assertEquals(metadata.date,"1995-08-20","Date has been set correctly");
        this.test.assertEquals(metadata.language,"en","Language has been set correctly");
        this.test.assertEquals(metadata.tags,["tag1","tag2"],"Tags have been set correctly");
        this.test.assertEquals(metadata.authors,[["Davies","Louise"],["S'chn T'gai","Spock"]],"Authors have been set correctly");
        this.test.assertEquals(metadata.publisher,"test publisher","Publisher has been set correctly");
        this.test.assertEquals(metadata.citation,"test citation","Citation has been set correctly");
        this.test.assertEquals(metadata.referencedBy,["URL1","URL2"],"ReferencedBy had been set correctly");
        this.test.assertEquals(metadata.repository,"edata/8","Repository has been set correctly");
    });

    //shutdown
    this.then(function() {
        this.shutdown_current_kernel();
    });
    this.wait(2000);

    this.then(function() {
        this.test.assertNot(this.kernel_running(),"Notebook shutdown successfully");
    });
   
    //go to dashboard
    this.then(function(){
        this.open_dashboard();
    });

    //go back into notebook - we're doing this to check that the notebook was saved automatically
    var nbname = 'Untitled.ipynb';
    this.then(function(){
        var notebook_url = this.evaluate(function(nbname){
            var escaped_name = encodeURIComponent(nbname);
            var return_this_thing = null;
            $("a.item_link").map(function (i,a) {
                if (a.href.indexOf(escaped_name) >= 0) {
                    return_this_thing = a.href;
                    return;
                }
            });
            return return_this_thing;
        }, {nbname:nbname});
        this.test.assertNotEquals(notebook_url, null, "Found URL in notebook list");
        // open the notebook
        this.open(notebook_url);
    });

    //wait for redirect
    this.waitFor(this.kernel_running);
    this.waitFor(function() {
        return this.evaluate(function () {
            return Jupyter && Jupyter.notebook && true;
        });
    });

    //check that we're back in the notebook (via checking the notebook name in the ipython instance)
    this.then( function() {
        var name = this.evaluate(function() {
            return Jupyter.notebook.notebook_name;
        });
        this.test.assertEquals(name, "Untitled.ipynb","Re-opened notebook successfully");
    });

    //check that our metadata has been saved to the notebook metadata
    this.then(function() {
        var that = this;
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    title: "",
                    abstract: "",
                    date:"",
                    language: '',
                    tags: [],
                    authors: [],
                    publisher: '',
                    citation: '',
                    referencedBy: [],
                    repository: ""
                };
            } else {
                return {
                    title: md.reportmetadata.title,
                    abstract: md.reportmetadata.abstract,
                    date: md.reportmetadata.date,
                    language: md.reportmetadata.language,
                    tags: md.reportmetadata.tags,
                    authors: md.reportmetadata.authors,
                    publisher: md.reportmetadata.publisher,
                    citation: md.reportmetadata.citation,
                    referencedBy: md.reportmetadata.referencedBy,
                    repository: md.reportmetadata.repository,
                };
            }
            
        });
        this.test.assertEquals(metadata.title,"My Title","Title has been saved correctly");
        this.test.assertEquals(metadata.abstract,"My abstract","Abstract has been saved correctly");
        this.test.assertEquals(metadata.date,"1995-08-20","Date has been saved correctly");
        this.test.assertEquals(metadata.language,"en","Language has been saved correctly");
        this.test.assertEquals(metadata.tags,["tag1","tag2"],"Tags have been set correctly");
        this.test.assertEquals(metadata.authors,[["Davies","Louise"],["S'chn T'gai","Spock"]],"Authors have been saved correctly");
        this.test.assertEquals(metadata.publisher,"test publisher","Publisher has been saved correctly");
        this.test.assertEquals(metadata.citation,"test citation","Citation has been saved correctly");
        this.test.assertEquals(metadata.referencedBy,["URL1","URL2"],"ReferencedBy had been saved correctly");
        this.test.assertEquals(metadata.repository,"edata/8","Repository has been saved correctly");
    });

    // Click on menuitem
    this.waitForSelector(selector);
    this.thenClick(selector);

    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    //check that when you reopen the dialog the text boxes have been filled with the current data
    this.then(function() {
        var vals = this.evaluate(function(){
            return {
                titleval: document.getElementById('title').value,
                abstractval: document.getElementById('abstract').value,
                yearval: document.getElementById('year').value,
                monthval: document.getElementById('month').value,
                dayval: document.getElementById('day').value,
                tagsval: document.getElementById('tags').value,
                authorfn0val: document.getElementById('author-first-name-0').value,
                authorln0val: document.getElementById('author-last-name-0').value,
                authorfn1val: document.getElementById('author-first-name-1').value,
                authorln1val: document.getElementById('author-last-name-1').value,
                languageval: document.getElementById('language').value,
                publisherval: document.getElementById('publisher').value,
                citationval: document.getElementById('citation').value,
                reference0val: document.getElementById('referencedBy-0').value,
                reference1val: document.getElementById('referencedBy-1').value,
                repositoryval: document.getElementById('repository').value,
            };
        });
        this.test.assertEquals(vals.titleval,"My Title","Title displays properly in the form once set");
        this.test.assertEquals(vals.abstractval,"My abstract","Abstract displays properly in the form once set");
        this.test.assertEquals(vals.yearval,"1995","Year displays properly in the form once set");
        this.test.assertEquals(vals.monthval,"8","Month displays properly in the form once set");
        this.test.assertEquals(vals.dayval,"20","Day displays properly in the form once set");
        this.test.assertEquals(vals.tagsval,"tag1\ntag2\n","Tags displays properly in the form once set");
        this.test.assertEquals(vals.authorfn0val,"Louise","1st author first name displays properly in the form once set");
        this.test.assertEquals(vals.authorln0val,"Davies","1st author last name displays properly in the form once set");
        this.test.assertEquals(vals.authorfn1val,"Spock","2nd author first name displays properly in the form once set");
        this.test.assertEquals(vals.authorln1val,"S'chn T'gai","2nd author last name displays properly in the form once set");
        this.test.assertEquals(vals.languageval,"en","Language displays properly in the form once set");
        this.test.assertEquals(vals.publisherval,"test publisher","Publisher displays properly in the form once set");
        this.test.assertEquals(vals.citationval,"test citation","Citation displays properly in the form once set");
        this.test.assertEquals(vals.reference0val,"URL1","Reference 0 displays properly in the form once set");
        this.test.assertEquals(vals.reference1val,"URL2","Reference 1 displays properly in the form once set");
        this.test.assertEquals(vals.repositoryval,"edata/8","Repository displays properly in the form once set");
    });

    //testing deletion of the multi-field vairables
    this.waitForSelector('#add-author-button');
    this.thenClick("#add-author-button");
    this.thenClick("#add-author-button");

    //Add some test metadata
    this.then(function() {
        this.fillSelectors('form#add_metadata_form > fieldset#fields1', {
            '#author-last-name-2': 'McCoy',
            '#author-first-name-2': 'Leonard',
            '#author-last-name-3': "Kirk",
            '#author-first-name-3': 'James T.',
        });
    }); 

    this.thenEvaluate(function() {
        $('#author-last-name-1').parent().find("button").click();
        $('#author-last-name-2').parent().find("button").click();
    });

    this.thenClick('#next');

    this.waitForSelector("#collections_loaded"); //feels dirty...

    this.waitForSelector("#add-url-button");
    this.thenClick("#add-url-button");
    this.thenClick("#add-url-button");

    this.then(function() {
        this.fillSelectors('form#add_metadata_form > fieldset#fields2', { //need to use fillSelectors for the referencedBy urls
            '#referencedBy-2': "URL3",
            '#referencedBy-3': "URL4",
        });
    });

    this.thenEvaluate(function() {
        $('#referencedBy-1').parent().find("button").click();
        $('#referencedBy-2').parent().find("button").click();
    });

    this.thenClick('#next');
    this.wait(300);

    //Should be within notebook metadata now.     
    this.then(function() {
        var that = this;
        var metadata = this.evaluate(function() {
            var md = Jupyter.notebook.metadata;
            if(!md.hasOwnProperty("reportmetadata")) {
                __utils__.echo("No reportmetadata");
                return {
                    authors: [],
                    referencedBy: [],
                };
            } else {
                return {
                    authors: md.reportmetadata.authors,
                    referencedBy: md.reportmetadata.referencedBy,
                };
            }
            
        });
        this.test.assertEquals(metadata.authors,[["Davies","Louise"],["Kirk","James T."]],"Authors have been set correctly after deleting some");
        this.test.assertEquals(metadata.referencedBy,["URL1","URL4"],"ReferencedBy had been set correctly after deleting some");
    });
    
});
