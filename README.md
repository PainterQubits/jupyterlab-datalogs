# DataLogger JupyterLab

JupyterLab extension for DataLogger.

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

to build the extension and start up a JupyterLab server.

> [!NOTE]  
> On Windows, symbolic links must be activated. On Windows 10 or above for Python version
> 3.8 or higher, this can be done by [activating developer mode](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development)
> Otherwise, you will see an error when running `yarn dev`.
