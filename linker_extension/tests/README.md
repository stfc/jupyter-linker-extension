# JavaScript Tests

This directory includes regression tests for the linker extension. These tests
depend on [CasperJS](http://casperjs.org/), which in turn requires a recent
version of [PhantomJS](http://phantomjs.org/).

To install PhantomJS and CasperJS

`npm install phantomjs-prebuilt casperjs`

To run all of the JavaScript tests do:

```
python -m linker_extension.jstest 
```

To run the JavaScript tests for a specific group (`notebook` in this case) do:
```
python -m linker_extension.jstest notebook
```

To run the JavaScript tests for a specific file (`notebook/add_metadata.js` in this case)
do:

```
python -m linker_extension.jstest notebook/add_metadata.js
```

Some of the above tests (tests that involve uploaad to DSpace) require a username and password. These can be entered at runtime for each test, or for convenience a login_credentials.txt file has been provided that the tests can read from. Simply replace the lines [Your Username Here] and [Your Password Here] with your username and password.

To run the original notebook tests (to test that the extension hasn't broken anything. It shouldn't, but we should test anyway) use the command:
```
python -m notebook.jstest 
```

The file `jstest.py` will automatically launch a notebook server to run the
tests against. You can however specify the url of a running notebook server
by using `--url=http://localhost:8888`.
