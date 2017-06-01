define(["base/js/namespace",
        "base/js/utils",
        "base/js/dialog",
        "../../custom_contents"
],function(Jupyter,utils,dialog,custom_contents){
	var md = Jupyter.notebook.metadata;
	
	var department_fields = function() {
        var departmentLabel = $("<label/>")
	        .attr("for","department")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Department: ");
	
	    var department = $("<select/>")
	        .attr("name","department")
	        .attr("required","required")
	        .attr("id","department")
	        .append($("<option/>").attr("value","").text("None Selected"));
	
	    var repositoryLabel = $("<label/>")
	        .attr("for","repository")
	        .addClass("required")
            .addClass("fieldlabel")
	        .text("Repository: ");
	
	    var repository = $("<select/>")
	        .attr("name","repository")
	        .attr("required","required")
	        .attr("id","repository")
	        .append($("<option/>").attr("value","").text("None Selected"));
	    
        department.change(function() {
            $("#repository").prop("disabled",false);
            repository.children().remove();
            repository.append($("<option/>").attr("value","").text("None Selected"));
            //only search if we're not on the default blank option as otherwise
            //this displays the communities
            if($(this).val()) {
                populate_repositories($(this).val()).then(function() {
                    if($("#repository").children().length === 0) {
                        $("#repository").prop("disabled",true);
                    }
                });
            } else {
                $("#repository").prop("disabled",true);
            }
        });   
    }
	
	var validate_department = function() {
        if(!$("#department").val()) {
            var department_error = $("<div/>")
                .attr("id","department-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a department to deposit to");

            $("label[for=\"department\"]").after(department_error);
        }
	}
	
	var validate_repository = function() {
        if(!$("#repository").val()) {
            var repository_error = $("<div/>")
                .attr("id","repository-missing-error")
                .addClass("metadata-form-error")
                .text("Please select a collection to deposit to");

            $("label[for=\"repository\"]").after(repository_error);
        }
	}
	
	var save_department_to_metadata = function () {
        md.reportmetadata.department = $("#department").val();
        md.reportmetadata.repository = $("#repository").val();
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
    
    var populate_repository_options = function(community) {
        return custom_contents.get_collections({"community": community}).then(function(response) {
            var collections = response.children;
            collections.forEach(function(collection) {
                var collection_option = $("<option/>");
                collection_option.attr("value",collection.handle);
                collection_option.text(collection.name);
                repository.append(collection_option);
            });
        }).catch(function(reason) {
            var repository_fetch_error = $("<div/>")
                .addClass("repository-fetch-error")
                .text("Couldn't download the collection information from eData." +
                      " Please reload and if the error persists contact the developers.")
                .css("color","red");
            $("label[for=\"repository\"]").after(repository_fetch_error);
        });
    };
    
    function set_dept_options() {
    	communities_promise.then(function(dept_list) {
    		dept_list.forEach(function(dept) {
                var dept_option = $("<option/>");
                dept_option.attr("value",dept.id);
                dept_option.text(dept.name);
                $("#department").append(communities_option);
            });
    	});
    }
    
    /*  
     *  Convert a department name into an option recognised by DSpace.
     */
    function set_dept_from_name(dept_name) {
    	communities_promise.then(function(dept_list) {
            dept_name = dept_name.replace(/\s/g,""); //remove whitespace
            var len = dept_name.length;
            var found = false;
            while(len > 0 && !found) {
                var short_dep = dept_name.slice(0,len);
                for(var i = 0; i < dept_list.length; i++) {
                    var re = new RegExp("^" + short_dep,"i");
                    if(dept_list[i].name.search(re) !== -1) {
                        dept_name = dept_list[i].name;
                        found = true;
                        break;
                    } 
                }
                len -= 1;
            }
            $("#department").val($("#department option").filter(function() {
                return $(this).text() === dept_name;
            }).val());
            populate_repositories($("#department").val());
        });
    }
    
    function set_dept_from_metadata() {
    	var metadata = Jupyter.notebook.metadata;
        communities_promise.then(function(dept_list) {
            department.val(metadata.reportmetadata.department);
            return populate_repositories(metadata.reportmetadata.department);
        }).then(function() {
            repository.val(metadata.reportmetadata.repository);
        });
    }
    
    module.exports = {

    };
});