"""NBConvert handler that allows us to specify a template file."""

import os

from tornado import web, escape

from notebook.base.handlers import IPythonHandler


from notebook.nbconvert.handlers import (
    get_exporter, respond_zip
)

from ipython_genutils import text

# ----------------------------------------------------------------------------
# Custom Nbconvert handler (need this to select template)
# ----------------------------------------------------------------------------


# This is copied from notbook.nbconvert.NbconvertFileHandler
# I just change it so that the exporter has a template file passed to it.
class CustomNbconvertHandler(IPythonHandler):

    SUPPORTED_METHODS = ('GET',)

    @web.authenticated
    def get(self, format, template_file, path):

        exporter = get_exporter(format, config=self.config, log=self.log, template_file=template_file)

        path = path.strip('/')
        model = self.contents_manager.get(path=path)
        name = model['name']
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)

        self.set_header('Last-Modified', model['last_modified'])

        try:
            output, resources = exporter.from_notebook_node(
                model['content'],
                resources={
                    "metadata": {
                        "name": name[:name.rfind('.')],
                        "modified_date": (model['last_modified']
                            .strftime(text.date_format))
                    },
                    "config_dir": self.application.settings['config_dir'],
                }
            )
        except Exception as e:
            self.log.exception("nbconvert failed: %s", e)
            raise web.HTTPError(500, "nbconvert failed: %s" % e)

        if respond_zip(self, name, output, resources):
            return

        # Force download if requested
        if self.get_argument('download', 'false').lower() == 'true':
            filename = os.path.splitext(name)[0] + resources['output_extension']
            self.set_header('Content-Disposition',
                            'attachment; filename="%s"' % escape.url_escape(filename))

        # MIME type
        if exporter.output_mimetype:
            self.set_header('Content-Type',
                            '%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)
