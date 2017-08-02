define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,dialog,events) {	
	var analysis_script = function(files, variables){
	    var code = "#Variables generated by Jupyter- do not edit this section\n";
	    
	    console.log("Creating dataplot script");	
	    
		for (var i = 0; i < variables.length; i++) {
	        code += variables[i].name + " = '" + variables[i].value + "'\n"
	    }
		code += "\n"
		code += "name = '" + files[0].path + "'\n"
	    
		code += "with open(name) as f:\n" +
	            "    data = f.read()\n" +
	            "\n" +
	            "    data = data.rstrip()\n" +
	            "    data = data.split('\\n')\n"
	    
	    code += "#End generated code\n\n"
	    	
	    code += "#Begin user script\n"
	                     
	    console.log("Generated script: " + code);
	    	
	    return(code);
	}
	
	module.exports = {analysis_script: analysis_script};
});