define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,dialog,events) {
    "use strict";

    var dataplot_toolbar = function(div, cell) {
    	$(div).addClass("generate-section");
        var title_container = $("<div/>").addClass("generate-title")
                                         .append("Generate dataplot cell");

        var code_container = $("<div/>").addClass("generate-code");
        
        var find_file_button = $("<span/>").addClass("btn btn-sm btn-default btn-file").text("Find file");
        var find_file_feedback = $("<input/>")
            .attr("readonly","readonly")
            .attr("type","text")
            .attr("id", "filename")
            .prop("disabled",true);
        var find_file = $("<input>")
            .attr("type","file")
            .attr("id","find_file")
            .attr("required","required")
            .attr("name","find_file[]")
            .attr("multiple","multiple");
        find_file_button.append(find_file);
        
        find_file.change(function() {
            var input = $(this);
            var numFiles = input.get(0).files ? input.get(0).files.length : 1;
            var label = input.val().replace(/\\/g, "/").replace(/.*\//, "");
            input.trigger("fileselect", [numFiles, label]);
        });

        find_file.on("fileselect", function(event, numFiles, label) {
            var log = numFiles > 1 ? numFiles + " files selected" : label;

            cell.metadata.inputfile = label;
            find_file_feedback.val(log);
        });
        
        code_container.append(find_file_button)
                      .append(find_file_feedback);
        
        var xaxis_input = $("<input/>")
        .addClass("xaxis xaxis_" + cell.cell_id)
        .attr("name","xaxis")
        .change(function() {
            update_metadata();
        })
        .focus(function() {
            Jupyter.keyboard_manager.edit_mode();
        });
        
        var xaxis_div = $("<div/>")
        .addClass("xaxis_div")
        .addClass("xaxis_div_" + cell.cell_id);

        xaxis_div.append("x axis label:")
        xaxis_div.append(xaxis_input);

        
        var yaxis_input = $("<input/>")
        .addClass("yaxis yaxis_" + cell.cell_id)
        .attr("name","yaxis")
        .change(function() {
            update_metadata();
        })
        .focus(function() {
            Jupyter.keyboard_manager.edit_mode();
        });
        
        var yaxis_div = $("<div/>")
        .addClass("yaxis_div")
        .addClass("yaxis_div_" + cell.cell_id);

        yaxis_div.append("y axis label:")
        yaxis_div.append(yaxis_input);
        

        
        //does what it says - updates the notebook metadata. Note - it doesn't
        //save the metadata, just updates it.
        function update_metadata() {
        	cell.metadata.yaxis = $(".yaxis_" + cell.cell_id).val();
        	cell.metadata.xaxis = $(".xaxis_" + cell.cell_id).val();
        }
        
        
        var generate_container = $("<div/>").addClass("generate-code");
        
        var generate_button = $("<span/>").addClass("btn btn-sm btn-default btn-add")
                                          .text("Generate code")
                                          .click(function() {
                                              generate_dataplot(cell);
                                          });
        
        generate_container.append(generate_button);
        
        $(div).append(title_container);
        $(div).append(code_container);
        $(div).append(xaxis_div);
        $(div).append(yaxis_div);
        $(div).append(generate_container);  
    };
    
    
    var generate_dataplot = function(cell) {
    	var dataplot_code = "filename = '" + cell.metadata.inputfile + "'\n" +
    	                    "xaxis = '" + cell.metadata.xaxis + "'\n" +
    	                    "yaxis = '" + cell.metadata.yaxis + "'\n" +
    	"import matplotlib.pyplot as plt\n" +
    	"import re\n" +
    	"\n" +
    	"with open('./data/' + filename) as f:\n" +
    	"    data = f.read()\n" +
    	"\n" +
    	"data = data.rstrip()\n" +
    	"data = data.split('\\n')\n" +
    	"\n" +
    	"x = list()\n" +
    	"y = list()\n" +
    	"\n" +
    	"for row in data:\n" +
    	"    xVar = re.split('\\s+', row)[0]\n" +
    	"    yVar = re.split('\\s+', row)[1]\n" +
    	"\n" +
    	"    try:\n" +
    	"        float(xVar)\n" +
    	"        float(yVar)\n" +
    	"        x.append(xVar)\n" +
    	"        y.append(yVar)\n" +
    	"    except Exception:\n" +
    	"        pass\n" +
    	"\n" +
    	"fig = plt.figure()\n" +
    	"\n" +
    	"ax1 = fig.add_subplot(111)\n" +
    	"\n" +
    	"ax1.set_xlabel(xaxis)\n" +
    	"ax1.set_ylabel(yaxis)\n" +
    	"\n" +
    	"ax1.plot(x,y, c='r', label=filename)\n" +
    	"\n" +
    	"leg = ax1.legend()\n" +
    	"\n" +
    	"plt.show()\n" +
    	"\n"
    	
    	cell.set_text(dataplot_code);
        cell.execute();
    }

    //Is the cell a dataplot generator cell?
    var is_dataplot = function(cell) {
        if (cell.metadata.dataplot === undefined) {
            return false;
        } else {
            return cell.metadata.dataplot;
        }
    };

    
    module.exports = {dataplot_toolbar: dataplot_toolbar,
    		          is_dataplot: is_dataplot};
});