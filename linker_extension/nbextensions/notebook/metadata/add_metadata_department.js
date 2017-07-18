define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents"
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	var department;
	var repository;
	var department_fields = function() {
        var dept_container = $("<div/>");
		
		var departmentLabel = $("<label/>")
	        .attr("for","department")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Department: ");
	
	    department = $("<select/>")
	        .attr("name","department")
	        .attr("required","required")
	        .attr("id","department")
	        .append($("<option/>").attr("value","").text("None Selected"));
	
	    var repositoryLabel = $("<label/>")
	        .attr("for","repository")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Repository: ");
	
	    repository = $("<select/>")
	        .attr("name","repository")
	        .attr("required","required")
	        .attr("id","repository")
	        .append($("<option/>").attr("value","").text("None Selected"));
	    
        department.change(function() {
        	repository.prop("disabled",false);
            repository.children().remove();
            repository.append($("<option/>").attr("value","").text("None Selected"));
            //only search if we're not on the default blank option as otherwise
            //this displays the communities
            if($(this).val()) {
                populate_repository_options($(this).val()).then(function() {
                    if(repository.children().length === 0) {
                    	repository.prop("disabled",true);
                    }
                });
            } else {
            	repository.prop("disabled",true);
            }
        }); 
        
        dept_container.append(departmentLabel)
                      .append(department)
                      .append(repositoryLabel)
                      .append(repository);
        
        populate_department(department);
        
        if (md.reportmetadata.department != undefined) {
        	set_dept_from_metadata(department, repository)
        }
        
        return dept_container;
    }
	
    
    function populate_department() {
        var config_username = "";
        var user_department = "";
        
        console.log("Populating department selector");
        
        custom_contents.get_config().then(function(response){
            config_username = response.username;
            console.log("Found username: " + config_username);
            //activate ldap_search promise
            return custom_contents.ldap_search({fedID: config_username});
        }).catch(function(reason){
            console.log("Couldn't get username: " + reason.message);
            config_username = "";
        }).then(function(response) {
        	var department_to_set = "";
        	
        	if (response != undefined) {
            	//resolve the ldap_search promise
                var parsed = JSON.parse(response);
                department_to_set = parsed.attributes.department[0].toUpperCase();
                console.log("Found department: " + department_to_set);
        	}

            set_dept_options(department_to_set);
        }).catch(function(reason) {
        	console.log("Failed to populate department list: " + reason.message);
        });
    }
	
	
	/*  
     *  Find the options for department.
     */ 
    var communities_promise = custom_contents.get_collections().then(function(response) {
        var communities = response.children;
        var comm_list = [];
        communities.forEach(function(community) {
            comm_list.push(community);
        });
        return(comm_list);
    }).catch(function(reason) { //error
        var department_fetch_error = $("<div/>")
            .addClass("department-fetch-error")
            .text("Couldn't download the department information from eData." +
                  " Please reload and if the error persists contact the developers.")
            .css("color","red");
        $("label[for=\"department\"]").after(department_fetch_error);
    });
    
    var populate_repository_options = function(community, set_repo) {
    	console.log("Populating repository options for " + community)
        return custom_contents.get_collections({"community": community}).then(function(response) {
            var collections = response.children;
            console.log("Found " + collections.length + " collections");
            collections.forEach(function(collection) {
            	console.log("Adding " + collection.name);
                var collection_option = $("<option/>");
                collection_option.attr("value",collection.handle);
                collection_option.text(collection.name);
                repository.append(collection_option);
                if (collection.name == "Default") {
                	repository.val(collection.handle);
                }
            });
            if (set_repo != undefined) {
            	repository.val(set_repo);
            }            
        }).catch(function(reason) {
            var repository_fetch_error = $("<div/>")
                .addClass("repository-fetch-error")
                .text("Couldn't download the collection information from eData." +
                      " Please reload and if the error persists contact the developers.")
                .css("color","red");
            $("label[for=\"repository\"]").after(repository_fetch_error);
        });
    };
    
    function check_dept_name(option_name, dept_name) {
    	dept_name = dept_name.replace(/\s/g,""); //remove whitespace
        var len = dept_name.length;
        while(len > 0) {
            var short_dep = dept_name.slice(0,len);
            var re = new RegExp("^" + short_dep,"i");
            if(option_name.search(re) !== -1) {
                return true;
            }
            len -= 1;
        }
        
        return false;
    }
    
    function set_dept_options(name_to_set) {
    	console.log("Setting department options");
    	communities_promise.then(function(dept_list) {
    		console.log("Found " + dept_list.length + " departments")
    		dept_list.forEach(function(dept) {
                var dept_option = $("<option/>");
                dept_option.attr("value",dept.id);
                dept_option.text(dept.name);
                console.log("Adding " + dept_option.text());
                department.append(dept_option);
                if (md.reportmetadata.department == undefined &&
                	check_dept_name(dept.name, name_to_set)) {
                	console.log("Setting department value to " + dept.name);
                	department.val(dept_option.val());
                }
            });
    		
    		if (md.reportmetadata.department != undefined) {
    			department.val(md.reportmetadata.department);
    		}
    	});
    }
	
	var save_department_to_metadata = function () {
		console.log("Saving metadata");
        md.reportmetadata.department = department.val();
        console.log("Department set to " + md.reportmetadata.department)
        md.reportmetadata.repository = repository.val();
	}
    
    function set_dept_from_metadata() {
        department.val(md.reportmetadata.department);
        console.log("Setting department to " + md.reportmetadata.department);
        populate_repository_options(md.reportmetadata.department, 
        		                    md.reportmetadata.repository);
    }
	
	var validate_dept_and_repo = function() {
        if(!department.val()) {
            var department_error = $("<div/>")
                .attr("id","department-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a department to deposit to");

            $("label[for=\"department\"]").after(department_error);
        }
        
        if(!repository.val()) {
            var repository_error = $("<div/>")
                .attr("id","repository-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a collection to deposit to");

            $("label[for=\"repository\"]").after(repository_error);
        }
	}
    
    module.exports = {
        department_fields: department_fields,
        validate_dept_and_repo: validate_dept_and_repo,
        save_department_to_metadata: save_department_to_metadata,
    };
});