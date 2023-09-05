import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { showDialog, Dialog } from "@jupyterlab/apputils";
import { spreadsheetIcon, codeIcon } from "@jupyterlab/ui-components";

const netcdfFileType: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:netcdf-file-type",
  description: "Adds NetCDF file type.",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
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
  },
};

const copyDataLoggerLoadCode: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:copy-datalogger-load-code",
  description: "Context menu item to copy code to load log files using DataLogger.",
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, factory: IFileBrowserFactory) => {
    app.commands.addCommand("datalogger-jupyterlab:open", {
      label: "Copy DataLogger Load Code",
      caption: "Copy code to load this log file using DataLogger.",
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

export default [netcdfFileType, copyDataLoggerLoadCode];
