FROM jupyterhub/singleuser

USER root

RUN apt-get update && apt-get install -y --quiet inetutils-traceroute curl

COPY /linker_extension/resources/blank.xml /srv/jupyterhub/blank.xml
COPY /linker_extension/resources/templates/custom_base.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom_base.tplx
COPY /linker_extension/resources/templates/custom_style_ipython.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom_style_ipython.tplx
COPY /linker_extension/resources/templates/custom_article.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom_article.tplx
COPY /linker_extension/resources/favicon.ico /opt/conda/lib/python3.5/site-packages/notebook/static/base/images/favicon.ico

COPY /dist/LinkerExtension-1.0.tar.gz /home/jovyan/work
RUN pip install LinkerExtension-1.0.tar.gz
RUN jupyter serverextension enable --py linker_extension --system
RUN jupyter nbextension install --py linker_extension
RUN jupyter nbextension enable --py linker_extension --system

RUN rm LinkerExtension-1.0.tar.gz
