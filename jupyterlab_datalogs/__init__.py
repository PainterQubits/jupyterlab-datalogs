"""JupyterLab extension for DataLogs."""


# Required for symlinking in development ("jupyter labextension develop --overwrite .")
def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "../labextension", "dest": "jupyterlab-datalogs"}]
