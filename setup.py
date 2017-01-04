#!/usr/bin/env python

import os
from setuptools import setup, find_packages
from setuptools.command.sdist import sdist
from setuptools.command.install import install


class CustomsdistCommand(sdist):

    def run(self):
        # insert custom code here
        import subprocess
        subprocess.call(['webpack'])
        sdist.run(self)

class CustomInstallCommand(install):

    def run(self):
        # insert custom code here
        install.run(self)
        import subprocess
        subprocess.call(['sudo jupyter serverextension enable --py '
                         'linker_extension --system'], shell=True)
        subprocess.call(['sudo jupyter nbextension install --py --overwrite '
                         'linker_extension --system'], shell=True)
        subprocess.call(['sudo jupyter nbextension enable --py '
                         'linker_extension --system'], shell=True)


def package_files(directory):
    paths = []
    for (path, directories, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('..', path, filename))
    return paths


phantomjs_files = package_files('linker_extension/tests/phantomjs')
slimerjs_files = package_files('linker_extension/tests/slimerjs')
resource_files = package_files('linker_extension/resources')
jsfiles = ['static/notebook/linker_extension_notebook.js',
           'static/tree/linker_extension_tree.js',
           'static/common/linker_extension_common.js']
cssfiles = ['static/notebook/notebook_style.css',
            'static/tree/tree_style.css',
            'static/common/common_style.css']

setup_args = dict(
    name='LinkerExtension',
    version='1.0',
    description='Extension for the linker project',
    author='Louise Davies',
    author_email='louise.davies@stfc.ac.uk',
    url='http://www.stfc.ac.uk/',
    packages=find_packages(),
    package_data={
        '': (jsfiles + cssfiles + ['tests/*.js', 'tests/*.md'] +
             phantomjs_files + slimerjs_files + resource_files)
    },
    install_requires=[
        'notebook>=4',
        'ldap3'
    ],
    cmdclass={
        'install': CustomInstallCommand,
        'sdist': CustomsdistCommand,
    }
)


def main():
    setup(**setup_args)


if __name__ == '__main__':
    main()
