from notebook.nbconvert.handlers import (
    get_exporter, respond_zip
)
import os
from tornado import web, escape
from ipython_genutils import text


def bundle(handler, model):
    """Transform, convert, bundle, etc. the notebook referenced by the given
    model.

    Then issue a Tornado web response using the `handler` to redirect
    the user's browser, download a file, show a HTML page, etc. This function
    must finish the handler response before returning either explicitly or by
    raising an exception.

    Parameters
    ----------
    handler : tornado.web.RequestHandler
        Handler that serviced the bundle request
    model : dict
        Notebook model from the configured ContentManager
    """
    exporter = get_exporter("pdf", config=handler.config, log=handler.log, template_file="custom_article")
    name = model['name']

    try:
        output, resources = exporter.from_notebook_node(
            model['content'],
            resources={
                "metadata": {
                    "name": name[:name.rfind('.')],
                    "modified_date": (model['last_modified']
                                      .strftime(text.date_format))
                },
                "config_dir": handler.application.settings['config_dir'],
            }
        )
        if respond_zip(handler, name, output, resources):
            return
        else:
            filename = os.path.splitext(name)[0] + ".pdf"
            handler.set_header('Content-Disposition',
                               'attachment; filename="%s"' % escape.url_escape(filename))
            handler.finish(output)

    except Exception as e:
        handler.log.exception("nbconvert failed: %s", e)
        raise web.HTTPError(500, "nbconvert failed: %s" % e)
