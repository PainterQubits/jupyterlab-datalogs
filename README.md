# DataLogs JupyterLab

JupyterLab extension for DataLogs.

## Installation

Install the latest version of JupyterLab DataLogs using pip:

```
pip install -U jupyterlab-datalogs --extra-index-url https://painterqubits.github.io/jupyterlab-datalogs/releases
```

This extension should run alongside
[JupyterLab](https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html)
version 4 (included with the `jupyterlab` extra). There are also a set of packages
required for analysis using DataLogs notebooks (included with the `analysis` extra), and
a set of recommended JupyterLab plugins (included with the `plugins` extra).

To automatically install with all of these extras, use the `all` extra:

```
pip install -U "jupyterlab-datalogs[all]" --extra-index-url https://painterqubits.github.io/jupyterlab-datalogs/releases
```

While the Real-Time Collaboration extension is included in the `plugins` extra for
[JupyterLab Open Warning](https://github.com/PainterQubits/jupyterlab-open-warning) to
work, the collaboration functionality can be disabled by running JupyterLab with the
following option:

```
jupyter lab --YDocExtension.disable_rtc True
```

## Development

To develop, the following dependencies must be installed:

- [Node.js](https://nodejs.org/en/download)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Python](https://www.python.org/downloads/)
- [Hatch](https://hatch.pypa.io/latest/install/)

Then, run

```bash
hatch run ci:jlpm
```

to install Node.js dependencies, and

```bash
hatch run dev
```

to build the extension and start up a JupyterLab server. The first time you do this, also
go to the Extension Manager tab in JupyterLab (the puzzle piece icon on the left) to
enable 3rd party extensions. Now the extension should be activated. When the source code
changes, it should automatically rebuild, and the updated extension will be used when the
page is reloaded.

> [!NOTE]  
> On Windows, symbolic links must be activated for `hatch run dev` to work. On Windows 10
> or above for Python version 3.8 or higher, this can be done by
> [activating developer mode](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development).
>
> Alternatively, you can run `hatch run build` to rebuild and reinstall the extension each
> time the source code changes, and `hatch run jupyter lab` to start a new JupyterLab
> server.
