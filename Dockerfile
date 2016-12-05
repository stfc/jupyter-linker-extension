# Build as jupyterhub/singleuser
# Run with the DockerSpawner in JupyterHub

FROM jupyterhub/singleuser

USER root
COPY /dist/LinkerExtension-1.0.tar.gz /home/jovyan/work

RUN pip install LinkerExtension-1.0.tar.gz
RUN apt-get update && apt-get install -y --quiet inetutils-traceroute curl

RUN jupyter serverextension enable --py linker_extension --system
RUN jupyter nbextension install --py linker_extension
RUN jupyter nbextension enable --py linker_extension --system

COPY /blank.xml /srv/jupyterhub/blank.xml
COPY /admin.txt /srv/jupyterhub/admin.txt
COPY /templates/custom-base.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom-base.tplx
COPY /templates/custom-style_ipython.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom-style_ipython.tplx
COPY /templates/custom-article.tplx /opt/conda/lib/python3.5/site-packages/nbconvert/templates/latex/custom-article.tplx

RUN rm LinkerExtension-1.0.tar.gz

USER jovyan

COPY /custom.css /home/jovyan/.jupyter/custom/custom.css
