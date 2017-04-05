#!/usr/bin/env python

import os
import sys
import shutil
import nbconvert
from setuptools import setup, find_packages
from setuptools.command.sdist import sdist
from setuptools.command.install import install
from distutils.cmd import Command

try:
    from shutil import which
except ImportError:
    ## which() function copied from Python 3.4.3; PSF license
    def which(cmd, mode=os.F_OK | os.X_OK, path=None):
        """Given a command, mode, and a PATH string, return the path which
        conforms to the given mode on the PATH, or None if there is no such
        file.
        `mode` defaults to os.F_OK | os.X_OK. `path` defaults to the result
        of os.environ.get("PATH"), or can be overridden with a custom search
        path.
        """
        # Check that a given file can be accessed with the correct mode.
        # Additionally check that `file` is not a directory, as on Windows
        # directories pass the os.access check.
        def _access_check(fn, mode):
            return (os.path.exists(fn) and os.access(fn, mode)
                    and not os.path.isdir(fn))

        # If we're given a path with a directory part, look it up directly rather
        # than referring to PATH directories. This includes checking relative to the
        # current directory, e.g. ./script
        if os.path.dirname(cmd):
            if _access_check(cmd, mode):
                return cmd
            return None

        if path is None:
            path = os.environ.get("PATH", os.defpath)
        if not path:
            return None
        path = path.split(os.pathsep)

        if sys.platform == "win32":
            # The current directory takes precedence on Windows.
            if not os.curdir in path:
                path.insert(0, os.curdir)

            # PATHEXT is necessary to check on Windows.
            pathext = os.environ.get("PATHEXT", "").split(os.pathsep)
            # See if the given file matches any of the expected path extensions.
            # This will allow us to short circuit when given "python.exe".
            # If it does match, only test that one, otherwise we have to try
            # others.
            if any(cmd.lower().endswith(ext.lower()) for ext in pathext):
                files = [cmd]
            else:
                files = [cmd + ext for ext in pathext]
        else:
            # On other platforms you don't have things like PATHEXT to tell you
            # what file suffixes are executable, so just pass on cmd as-is.
            files = [cmd]

        seen = set()
        for dir in path:
            normdir = os.path.normcase(dir)
            if not normdir in seen:
                seen.add(normdir)
                for thefile in files:
                    name = os.path.join(dir, thefile)
                    if _access_check(name, mode):
                        return name
        return None


# On build, build the javascript files (production ver)
class CustomsdistCommandProd(sdist):

    def run(self):
        # insert custom code here
        import subprocess

        repo_root = os.path.dirname(os.path.abspath(__file__))

        install = False
        if not which('npm'):
            print("npm is required to build the notebook.", file=sys.stderr)
        if not os.path.exists(os.path.join(repo_root, 'node_modules')):
            install = True

        if install:
            subprocess.check_call(["npm","install","--progress=false"],cwd=repo_root)

        subprocess.check_call(["webpack", "-p"])

        sdist.run(self)


# On build, build the javascript files (dev ver)
class CustomsdistCommandDev(sdist):

    def run(self):
        # insert custom code here

        import subprocess

        repo_root = os.path.dirname(os.path.abspath(__file__))

        install = False
        if not which('npm'):
            print("npm is required to build the notebook.", file=sys.stderr)
        if not os.path.exists(os.path.join(repo_root, 'node_modules')):
            install = True

        if install:
            subprocess.check_call(["npm","install","--progress=false"],cwd=repo_root)

        subprocess.check_call(["webpack"])

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
resource_files = package_files('linker_extension/resources')
jsfiles = ['nbextensions/notebook/linker_extension_notebook.js',
           'nbextensions/common/linker_extension_common.js']
cssfiles = ['nbextensions/notebook/notebook_style.css',
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
             notebook_tests + resource_files + ['tests/*.txt']
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
