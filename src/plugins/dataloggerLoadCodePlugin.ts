import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ILauncher } from "@jupyterlab/launcher";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { NotebookPanel, NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
import { addIcon, notebookIcon } from "@jupyterlab/ui-components";
import { generateLoadCode, addToActiveCell } from "@/utils";

const logMimetypes = new Set(["application/json", "application/x-netcdf"]);

/**
 * Along with its corresponding schema (schema/datalogger-load-code.json), this plugin
 * adds items to the context menu that generate code that loads log files using
 * DataLogger.
 */
const dataloggerLoadCodePlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:datalogger-load-code",
  description: "Context menu items to generate code that loads logs with DataLogger.",
  autoStart: true,
  requires: [ILauncher, IFileBrowserFactory, INotebookTracker],
  activate: (
    { commands }: JupyterFrontEnd,
    launcher: ILauncher,
    { tracker: fileBrowserTracker }: IFileBrowserFactory,
    notebookTracker: INotebookTracker,
  ) => {
    commands.addCommand("datalogger-jupyterlab:add-datalogger-load-code", {
      label: "Add DataLogger Load Code",
      icon: addIcon,
      execute: async () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser === null) return;
        const files = [...fileBrowser.selectedItems()];

        // Get the current notebook
        let { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        await notebookPanel.context.ready;
        const { content: notebook } = notebookPanel;

        // Create a new cell with the load code
        NotebookActions.insertBelow(notebook);
        await addToActiveCell(notebook, generateLoadCode(files, notebookPanel));
      },
      isVisible: () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        return (
          notebookTracker.currentWidget !== null &&
          fileBrowser !== null &&
          [...fileBrowser.selectedItems()].every(({ mimetype }) =>
            logMimetypes.has(mimetype),
          )
        );
      },
    });

    async function newDataloggerNotebook() {
      // Create a new notebook
      const notebookPanel: NotebookPanel = await commands.execute("notebook:create-new");
      await notebookPanel.context.ready;
      const { content: notebook } = notebookPanel;

      // Add imports and a blank cell
      await addToActiveCell(notebook, "from datalogger import load_log");
      NotebookActions.insertBelow(notebook);
    }

    commands.addCommand("datalogger-jupyterlab:new-datalogger-notebook", {
      label: "New DataLogger Notebook",
      icon: notebookIcon,
      execute: newDataloggerNotebook,
    });

    commands.addCommand("datalogger-jupyterlab:datalogger-notebook", {
      label: "DataLogger Notebook",
      icon: notebookIcon,
      caption: "Create a new notebook for use with DataLogger",
      execute: newDataloggerNotebook,
    });

    launcher.add({
      category: "Notebook",
      command: "datalogger-jupyterlab:datalogger-notebook",
    });
  },
};

export default dataloggerLoadCodePlugin;
