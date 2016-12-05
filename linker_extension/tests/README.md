# IPython Notebook JavaScript Tests

This directory includes regression tests for the web notebook. These tests
depend on [CasperJS](http://casperjs.org/), which in turn requires a recent
version of [PhantomJS](http://phantomjs.org/).

To run all of the JavaScript tests do:

```
python -m linker_extension.jstest 
```

To run the JavaScript tests for a specific file (`phantomjs/select_data.js` in this case)
do:

```
python -m linker_extension.jstest phantomjs/select_data.js
```

Those in the folder phantomjs shhould be run with phantomjs (no command line argument needed). Those in the slimerjs folder require slimerjs and should be run with the command line argument `--slimerjs`

```
python -m linker_extension.jstest slimerjs/add_metadata.js
```

```
python -m notebook.jstest 
```

To run the original notebook tests (to test that the extension hasn't broken anything. It shouldn't, but we should test anyway) use the command:



The file `jstest.py` will automatically launch a notebook server to run the
tests against. You can however specify the url of a running notebook server
by using `--url=http://localhost:8888`.
