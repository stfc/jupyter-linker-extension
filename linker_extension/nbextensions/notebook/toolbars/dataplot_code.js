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

with open('./data/' + filename) as f:
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

fig = plt.figure()

ax1 = fig.add_subplot(111)

ax1.set_xlabel(xaxis)
ax1.set_ylabel(yaxis)

ax1.plot(x,y, c='r', label=filename)

fig.text(0.95,0.5,caption,fontsize=12);

plt.show()
*/});
	
	
var dataplot_script = function(filename, xaxis, yaxis, caption){
    var dataplot_code = "filename = '" + filename + "'\n" +
                        "xaxis = '" + xaxis + "'\n" +
                        "yaxis = '" + yaxis + "'\n" +
                        "caption = '" + caption + "'\n" +
                        script.replace(/\t/g, '');

    return(dataplot_code);
}

module.exports = {dataplot_script: dataplot_script};
});