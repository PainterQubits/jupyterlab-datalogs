import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { showDialog, Dialog } from "@jupyterlab/apputils";
import { spreadsheetIcon, codeIcon } from "@jupyterlab/ui-components";

// TODO: These can be separate plugins within the same extension

const plugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:plugin",
  description: "JupyterLab plugin for DataLogger",
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, factory: IFileBrowserFactory) => {
    // Add NetCDF file type
    const docRegistry = app.docRegistry;
    if (docRegistry.getFileType("netcdf") === undefined) {
      docRegistry.addFileType({
        name: "netcdf",
        displayName: "NetCDF File",
        extensions: [".nc"],
        mimeTypes: ["application/x-netcdf"],
        contentType: "file",
        fileFormat: "base64",
        icon: spreadsheetIcon,
      });
    }

    // Context menu command
    app.commands.addCommand("datalogger-jupyterlab:open", {
      label: "Copy DataLogger Load Code",
      caption: "Example context menu button for file browser's items.",
      icon: codeIcon,
      execute: () => {
        const file = factory.tracker.currentWidget?.selectedItems().next().value;

        if (file) {
          showDialog({
            title: file.name,
            body: `load_log("${file.path}")`,
            buttons: [Dialog.okButton()],
          }).catch((e) => console.log(e));
        }
      },
    });
  },
};

export default plugin;
