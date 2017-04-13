FROM jupyterhub/singleuser

USER root

RUN apt-get update && apt-get install -y --quiet inetutils-traceroute curl

COPY /linker_extension/resources/favicon.ico /opt/conda/lib/python3.5/site-packages/notebook/static/base/images/favicon.ico

COPY /dist/LinkerExtension-1.0.tar.gz /home/jovyan/work
RUN pip install LinkerExtension-1.0.tar.gz
RUN jupyter serverextension enable --py linker_extension --sys-prefix
RUN jupyter nbextension install --py linker_extension
RUN jupyter nbextension enable --py linker_extension --sys-prefix
#RUN jupyter bundlerextension enable --py --sys-prefix linker_extension

RUN rm LinkerExtension-1.0.tar.gz
