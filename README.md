# Jupyter Linker Extension

This is the Jupyter Notebook extension for the linker project.

TODO: upload to PyPi to make simple install easier?

### BUILD AND INSTALL INSTRUCTIONS

Install Node.js and npm

Download and extract or clone this git repo.

Navigate into the extracted/cloned folder and run the command:

`python setup.py build_dev`

or, if building for production (minifies files)

`python setup.py build_prod`

Install using the command:

`pip install dist/LinkerExtension-1.0.tar.gz`

Install and enable the extensions by running the command:

`python setup.py installextensions`

This requires elevated permission to be able to install the extension globally. TODO: is it sensible to do a system-wide install & enable by default? or copy the Jupyter.