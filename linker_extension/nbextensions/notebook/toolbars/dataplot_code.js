define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,dialog,events) {	

/*
 * We need to embed the text of a python script in javascript.
 * 
 * Multiline strings are supported using backticks, but not by the testing infrastructure.
 * 
 * A hack found at http://stackoverflow.com/questions/805107/creating-multiline-strings-in-javascript
 * gets around this- you define a function with a multiline comment, then remove the comment tags.
 * 
 * I'm not happy about this at all.
 */
function comments_to_multiline_string(f) {
	return f.toString().replace(/^[^\/]+\/\*!?/, '')
                   .replace(/\*\/[^\/]+$/, '');
}

var script = comments_to_multiline_string(function() {/*!
import matplotlib.pyplot as plt
import re

datasets = list()

for name in filenames:
    with open(name) as f:
        data = f.read()
    
    data = data.rstrip()
    data = data.split('\n')
    
    x = list()
    y = list()
    
    for row in data:
        xVar = re.split('\s+', row)[0]
        yVar = re.split('\s+', row)[1]
    
        try:
            float(xVar)
            float(yVar)
            x.append(xVar)
            y.append(yVar)
        except Exception:
            pass
          
    datasets.append((x,y,name))
	
fig = plt.figure()

ax = fig.add_subplot(111)
ax.set_xlabel(xaxis)
ax.set_ylabel(yaxis)

colourlist = ['r', 'b', 'y', 'g']

for data in datasets:
    ax.plot(data[0],data[1], label=data[2].replace(".dat", ""))

fig.text(0.95,0.5,caption,fontsize=12);

ax.legend()

plt.show()
*/});
	
script = script.replace(/\t/g, '');
	
var dataplot_script = function(files, xaxis, yaxis, caption){
    var dataplot_code = "xaxis = '" + xaxis + "'\n" +
                        "yaxis = '" + yaxis + "'\n" +
                        "caption = '" + caption + "'\n" +
                        "filenames = list()" + "\n";
    
    console.log("Creating dataplot script (files below)");	
    console.log(files);
    
	for (var i = 0; i < files.length; i++) {
        dataplot_code += "filenames.append('" + files[i].path + "')\n"
    }
    
    dataplot_code += script;

    return(dataplot_code);
}

module.exports = {dataplot_script: dataplot_script};
});