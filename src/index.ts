import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";

/**
 * Initialization data for the jupyterlab_apod extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger_jupyterlab:plugin",
  description: "JupyterLab plugin for DataLogger",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log("JupyterLab extension datalogger_jupyterlab is activated!");
  },
};

export default plugin;
