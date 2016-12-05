
define(['base/js/namespace','/usr/local/share/jupyter/nbextensions/linker_extension/custom_contents'], function(Jupyter){
    "use strict";

    function load_ipython_extension(){
        console.log('Custom contents loaded');
    }

    Object.defineProperty(Jupyter, "custom_contents", {
        get: function() { 
            console.warn('accessing `'+"custom_contents"+'` is deprecated. Use `require("'+"nbextensions/linker_extension/custom_contents"+'").'+"custom_contents"+'`');
            return require("/usr/local/share/jupyter/nbextensions/linker_extension/custom_contents.js"); 
        },
        enumerable: true,
        configurable: false
    });

	return Jupyter;
});
