# DataLogger JupyterLab

JupyterLab extension for DataLogger.

## Installation

Install the latest version of DataLogger JupyterLab using pip:

```
pip install -U datalogger-jupyterlab --extra-index-url https://painterqubits.github.io/datalogger-jupyterlab/releases
```

This extension requires
[JupyterLab]
version 4 and the
[JupyterLab Real-Time Collaboration]
extension. To install both of these automatically along with DataLogger JupyterLab, use
the `jupyterlab` extra:

```
pip install -U "datalogger-jupyterlab[jupyterlab]" --extra-index-url https://painterqubits.github.io/datalogger-jupyterlab/releases
```

While the Real-Time Collaboration extension is required in order to display open warning
dialogs, the collaboration functionality can be disabled by running JupyterLab with the
following option:

```
jupyter lab --YDocExtension.disable_rtc True
```

Also, in order to make the most of this extension, DataLogger should be installed in the
active Python kernel. See https://github.com/PainterQubits/datalogger for installation
instructions.

[JupyterLab]: https://jupyterlab.readthedocs.io/en/stable/getting_started/installation.html
[JupyterLab Real-Time Collaboration]: https://jupyterlab-realtime-collaboration.readthedocs.io/en/latest/

## Development

To develop, the following dependencies must be installed:

- [Node.js](https://nodejs.org/en/download)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Python](https://www.python.org/downloads/)
- [Hatch](https://hatch.pypa.io/latest/install/)

Then, run

```bash
yarn
```

to install Node.js dependencies, and

```bash
yarn dev
```

to build the extension and start up a JupyterLab server. The first time you do this, also
go to the Extension Manager tab in JupyterLab (the puzzle piece icon on the left) to
enable 3rd party extensions. Now the extension should be activated. When the source code
changes, it should automatically rebuild, and the updated extension will be used when the
page is reloaded.

> [!NOTE]  
> On Windows, symbolic links must be activated for `yarn dev` to work. On Windows 10 or
> above for Python version 3.8 or higher, this can be done by
> [activating developer mode](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development).
>
> Alternatively, you can run `yarn preview` to rebuild and reinstall the extension each
> time the source code changes.
