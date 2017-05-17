define([
    "base/js/namespace",
    "base/js/dialog",
    "base/js/events"
], function(Jupyter,dialog,events) {

var script = `
import matplotlib.pyplot as plt
import re

with open('./data/' + filename) as f:
    data = f.read()

data = data.rstrip()
data = data.split('\\n')

x = list()
y = list()

for row in data:
    xVar = re.split('\\s+', row)[0]
    yVar = re.split('\\s+', row)[1]

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

leg = ax1.legend()

plt.show()\n`
	
var generate_script = function(filename, xaxis, yaxis){
    var dataplot_code = "filename = '" + filename + "'\n" +
                        "xaxis = '" + xaxis + "'\n" +
                        "yaxis = '" + yaxis + "'\n" +
                        script.replace(/\t/g, '');

    return(dataplot_code);
}

module.exports = {generate_script: generate_script};
});