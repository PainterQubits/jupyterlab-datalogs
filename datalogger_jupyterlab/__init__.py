# Appears to be needed only for running "jupyter labextension develop --overwrite ."
# in development. Thus, this module is not included in the distribution.

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "datalogger-jupyterlab"
    }]
