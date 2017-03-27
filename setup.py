#!/usr/bin/env python

import os
import sys
import shutil
import nbconvert
from setuptools import setup, find_packages
from setuptools.command.sdist import sdist
from setuptools.command.install import install
from distutils.cmd import Command


# On build, build the javascript files (production ver)
class CustomsdistCommandProd(sdist):

    def run(self):
        # insert custom code here
        try:
            import subprocess
            webpack = subprocess.call('npm list webpack', shell=True)
            es6_promise = subprocess.call('npm list es6-promise', shell=True)
            install_cmd = "npm install"
            install = False

            if webpack != 0:  # 0 means it is installed
                install_cmd = install_cmd + " webpack"
                install = True

            if es6_promise != 0:
                install_cmd = install_cmd + " es6-promise"
                install = True

            install_cmd = install_cmd + " --progress=false"
            if install:
                subprocess.call(install_cmd, shell=True)

            subprocess.call("webpack -p")
        except OSError as e:
            print("Failed to run `npm install`: %s" % e, file=sys.stderr)
            print("npm is required to build the notebook.", file=sys.stderr)
        sdist.run(self)


# On build, build the javascript files (dev ver)
class CustomsdistCommandDev(sdist):

    def run(self):
        # insert custom code here
        try:
            import subprocess
            webpack = subprocess.call('npm list -g webpack', shell=True)
            es6_promise = subprocess.call('npm list -g es6-promise', shell=True)
            install_cmd = "npm install -g"
            install = False

            if webpack != 0:  # 0 means it is installed
                install_cmd = install_cmd + " webpack"
                install = True

            if es6_promise != 0:
                install_cmd = install_cmd + " es6-promise"
                install = True

            install_cmd = install_cmd + " --progress=false"
            if install:
                subprocess.call(install_cmd, shell=True)

            subprocess.call("webpack")
        except OSError as e:
            print("Failed to run `npm install`: %s" % e, file=sys.stderr)
            print("npm is required to build the notebook.", file=sys.stderr)
        sdist.run(self)


class CustomInstallExtenstionsCommand(Command):
    description = "Install and enable the extension"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import subprocess
        subprocess.call('jupyter serverextension enable --py '
                        'linker_extension --system', shell=True)
        subprocess.call('jupyter nbextension install --py --overwrite '
                        'linker_extension --system', shell=True)
        subprocess.call('jupyter nbextension enable --py '
                        'linker_extension --system', shell=True)


class CustomUninstallExtenstionsCommand(Command):
    description = "Uninstall and disable the extension"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import subprocess
        subprocess.call('jupyter nbextension disable --py '
                        'linker_extension --system', shell=True)
        subprocess.call('jupyter nbextension uninstall --py '
                        'linker_extension --system', shell=True)
        subprocess.call('jupyter serverextension disable --py '
                        'linker_extension --system', shell=True)


# on install, install and enable the extension and copy the template files
# to their proper location
class CustomInstallCommand(install):

    def run(self):
        install.run(self)
        # insert custom code here
        nbconvert_loc = os.path.dirname(nbconvert.__file__)
        template_path = os.path.join(nbconvert_loc, 'templates', 'latex')
        shutil.move(os.path.join('linker_extension',
                                 'resources',
                                 'templates',
                                 'custom_base.tplx'),
                    os.path.join(template_path, 'custom_base.tplx'))

        shutil.move(os.path.join('linker_extension',
                                 'resources',
                                 'templates',
                                 'custom_article.tplx'),

                    os.path.join(template_path, 'custom_article.tplx'))

        shutil.move(os.path.join('linker_extension',
                                 'resources',
                                 'templates',
                                 'custom_style_ipython.tplx'),
                    os.path.join(template_path, 'custom_style_ipython.tplx'))


# return an array of paths of all files in the specified directory
def package_files(directory):
    paths = []
    for (path, directories, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('..', path, filename))
    return paths


notebook_tests = package_files('linker_extension/tests/notebook')
tree_tests = package_files('linker_extension/tests/tree')
resource_files = package_files('linker_extension/resources')
jsfiles = ['nbextensions/notebook/linker_extension_notebook.js',
           'nbextensions/tree/linker_extension_tree.js',
           'nbextensions/common/linker_extension_common.js']
cssfiles = ['nbextensions/notebook/notebook_style.css',
            'nbextensions/tree/tree_style.css',
            'nbextensions/common/common_style.css']

setup_args = dict(
    name='LinkerExtension',
    version='1.0',
    description='Extension for the linker project',
    author='Louise Davies',
    author_email='louise.davies@stfc.ac.uk',
    url='http://www.stfc.ac.uk/',
    packages=find_packages(),
    package_data={
        '': (jsfiles + cssfiles + ['*.md', 'tests/*.js', 'tests/*.md'] +
             notebook_tests + tree_tests + resource_files + ['tests/*.txt']
             + ["nbextensions/common/logo.png","nbextensions/common/favicon.ico"])
    },
    install_requires=[
        'notebook>=4',
        'nbconvert',
        'ldap3',
        'requests',
	'requests-futures',
    ],
    cmdclass={
        'install': CustomInstallCommand,
        'build_prod': CustomsdistCommandProd,
        'build_dev': CustomsdistCommandDev,
        'installextensions': CustomInstallExtenstionsCommand,
        'uninstallextensions': CustomUninstallExtenstionsCommand,
    }
)


def main():
    setup(**setup_args)


if __name__ == '__main__':
    main()
