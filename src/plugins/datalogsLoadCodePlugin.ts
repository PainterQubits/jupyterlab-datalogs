import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { ILauncher } from "@jupyterlab/launcher";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { NotebookPanel, NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
import { addIcon } from "@jupyterlab/ui-components";
import { PACKAGE_NAME, JSON_MIMETYPE, NETCDF_MIMETYPE } from "@/constants";
import { generateLoadCode, addToNotebook } from "@/utils";
import { chartLineIcon, chartLineIconUrl } from "@/icons";

const logMimetypes = new Set([JSON_MIMETYPE, NETCDF_MIMETYPE]);

const datalogsNotebookImports = [
  "import numpy as np",
  "import xarray as xr",
  "import matplotlib.pyplot as plt",
  "from datalogs import load_log, DictLog, DataLog",
];

/**
 * Along with its corresponding schema (schema/datalogs-load-code.json), this plugin
 * adds items to the file browser context menu, the main menu, and the Launcher to
 * add code to notebooks for loading log files using DataLogs.
 */
export const datalogsLoadCodePlugin: JupyterFrontEndPlugin<void> = {
  id: `${PACKAGE_NAME}:datalogs-load-code-plugin`,
  description: "Shortcuts to generate code that loads logs with DataLogs.",
  autoStart: true,
  requires: [ILauncher, IFileBrowserFactory, INotebookTracker],
  activate(
    { commands }: JupyterFrontEnd,
    launcher: ILauncher,
    { tracker: fileBrowserTracker }: IFileBrowserFactory,
    notebookTracker: INotebookTracker,
  ) {
    commands.addCommand(`${PACKAGE_NAME}:add-datalogs-load-code-command`, {
      label: "Add DataLogs Load Code",
      icon: addIcon,
      execute: async () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser === null) return;
        const files = [...fileBrowser.selectedItems()];

        // Get the current notebook
        const { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        await notebookPanel.context.ready;
        const { content: notebook } = notebookPanel;

        // Add a cell with load code for each file
        for (const file of files) {
          await addToNotebook(notebook, generateLoadCode(file, notebookPanel));
        }
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

    async function newDatalogsNotebook() {
      // Create a new notebook
      const notebookPanel: NotebookPanel = await commands.execute("notebook:create-new");
      await notebookPanel.context.ready;
      const { content: notebook } = notebookPanel;

      // Add imports and headers
      await addToNotebook(notebook, "## Imports", {
        insertLocation: "currentCell",
        cellType: "markdown",
      });
      await addToNotebook(notebook, datalogsNotebookImports.join("\n"));
      await addToNotebook(notebook, "## Load Logs", { cellType: "markdown" });
      await addToNotebook(notebook);
      NotebookActions.renderAllMarkdown(notebook);

      // Set active cell to first cell
      notebook.activeCellIndex = 2;
    }

    // Used in file browser context menu
    commands.addCommand(`${PACKAGE_NAME}:new-datalogs-notebook-command`, {
      label: "New DataLogs Notebook",
      icon: chartLineIcon,
      execute: newDatalogsNotebook,
    });

    // Used in main menu File > New
    commands.addCommand(`${PACKAGE_NAME}:datalogs-notebook-command`, {
      label: "DataLogs Notebook",
      icon: chartLineIcon,
      execute: newDatalogsNotebook,
    });

    // Used in Launcher
    commands.addCommand(`${PACKAGE_NAME}:datalogs-command`, {
      label: "DataLogs",
      icon: chartLineIcon,
      execute: newDatalogsNotebook,
    });

    launcher.add({
      category: "Notebook",
      command: `${PACKAGE_NAME}:datalogs-command`,
      kernelIconUrl: chartLineIconUrl,
    });
  },
};

export default datalogsLoadCodePlugin;
