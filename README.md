# Jupyter Linker Extension

This is the Jupyter Notebook extension for the linker project.

### INSTALLATION INSTRUCTIONS

Download and extract or clone this git repo.

Install by using `pip install linker_extension`

The install will automatically enable the server extension and install and enable the javascript extensions. This means that every notebook is set to load these extensions by default.

NOTE: currently, to be able to use this extension an admin.txt file needs to be placed into the `linker_extension/resources` folder in the LinkerExtension install location (site-packages or dist-packages - whichever is standard on your system). This admin.txt file needs the ePubs admin account username on the first line and the admin account password on the second line.