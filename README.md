# Jupyter Linker Extension

This is the Jupyter Notebook extension for the linker project.

TODO: upload to PyPi to make simple install easier?

### BUILD AND INSTALL INSTRUCTIONS

Install Node.js and npm

Install webpack via `npm install -g webpack`

Download and extract or clone this git repo.

Navigate into the extracted/cloned folder and run the command:
`python setup.py sdist --formats=gztar,zip`

Install by using `pip install .` or `pip install dist/LinkerExtension-1.0.tar.gz`

Install and enable the extensions by running the command:
`python setup.py installextensions`
This requires elevated permission to be able to install the extension globally. TODO: is it sensible to do a system-wide install & enable by default? or copy the Jupyter.

NOTE: the certificates haven't been sorted out yet so the requests aren't HTTPS. Don't use as it currently is! TODO: make everything secure 