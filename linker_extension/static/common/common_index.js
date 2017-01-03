var modify_common_html = require("./modify_common_html.js");

function load_ipython_extension(){
    console.log('Linker extension (common) loaded');

    modify_common_html.load();
}

module.exports = {load_ipython_extension: load_ipython_extension};
