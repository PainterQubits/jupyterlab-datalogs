"""JupyterLab extension for DataLogger."""


# Required for symlinking in development ("jupyter labextension develop --overwrite .")
def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "../labextension", "dest": "jupyterlab-datalogger"}]
