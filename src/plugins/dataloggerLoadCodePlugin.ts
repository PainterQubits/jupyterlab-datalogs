import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ILauncher } from "@jupyterlab/launcher";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { NotebookPanel, NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
import { addIcon } from "@jupyterlab/ui-components";
import { generateLoadCode, addToActiveCell } from "@/utils";
import { chartLineIcon, chartLineIconUrl } from "@/icons";

const logMimetypes = new Set(["application/json", "application/x-netcdf"]);

/**
 * Along with its corresponding schema (schema/datalogger-load-code.json), this plugin
 * adds items to the file browser context menu, the main menu, and the Launcher to
 * add code to notebooks for loading log files using DataLogger.
 */
const dataloggerLoadCodePlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:datalogger-load-code",
  description: "Shortcuts to generate code that loads logs with DataLogger.",
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

      // Set active cell to first cell
      notebook.activeCellIndex = 0;
    }

    // Used in file browser context menu
    commands.addCommand("datalogger-jupyterlab:new-datalogger-notebook", {
      label: "New DataLogger Notebook",
      icon: chartLineIcon,
      execute: newDataloggerNotebook,
    });

    // Used in main menu File > New
    commands.addCommand("datalogger-jupyterlab:datalogger-notebook", {
      label: "DataLogger Notebook",
      icon: chartLineIcon,
      execute: newDataloggerNotebook,
    });

    // Used in Launcher
    commands.addCommand("datalogger-jupyterlab:datalogger", {
      label: "DataLogger",
      icon: chartLineIcon,
      execute: newDataloggerNotebook,
    });

    launcher.add({
      category: "Notebook",
      command: "datalogger-jupyterlab:datalogger",
      kernelIconUrl: chartLineIconUrl,
    });
  },
};

export default dataloggerLoadCodePlugin;
