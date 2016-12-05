#!/usr/bin/env python

import os
from setuptools import setup, find_packages

def package_files(directory):
    paths = []
    for (path, directories, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('..', path, filename))
    return paths

static_files = package_files('linker_extension/static')
phantomjs_files = package_files('linker_extension/tests/phantomjs')
slimerjs_files = package_files('linker_extension/tests/slimerjs')
print(phantomjs_files)
print(find_packages())

setup_args = dict(
    name='LinkerExtension',
    version='1.0',
    description='Extension for the linker project',
    author='Louise Davies',
    author_email='louise.davies@stfc.ac.uk',
    url='http://www.stfc.ac.uk/',
    packages=find_packages(),
    package_data={
        '':static_files + ['tests/*.js','tests/*.md'] + phantomjs_files + slimerjs_files
    },
    install_requires = [
        'notebook>=4',
        'ldap3'
    ]
)

def main():
    setup(**setup_args)

if __name__ == '__main__':
    main()
