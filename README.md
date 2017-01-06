# Jupyter Linker Extension

This is the Jupyter Notebook extension for the linker project.

### INSTALLATION INSTRUCTIONS

Download and extract or clone this git repo.

Install by using `pip install dist/LinkerExtension-1.0.tar.gz`

The install will automatically enable the server extension and install and enable the javascript extensions. This means that every notebook is set to load these extensions by default.

TODO: upload to PyPi to make simple install easier?

### BUILD AND INSTALL INSTRUCTIONS

Install Node.js and npm

Install webpack via `npm install -g webpack`

Download and extract or clone this git repo.

Navigate into the extracted/cloned folder and run the command `python setup.py sdist`

Install by using `pip install .` or `pip install dist/LinkerExtension-1.0.tar.gz`



NOTE: the certificates haven't been sorted out yet so the requests aren't HTTPS. Don't use as it currently is! TODO: make everything secure 