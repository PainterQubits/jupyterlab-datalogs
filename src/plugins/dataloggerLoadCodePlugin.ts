import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
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
  requires: [IFileBrowserFactory, INotebookTracker],
  activate: (
    { commands, serviceManager }: JupyterFrontEnd,
    { tracker: fileBrowserTracker }: IFileBrowserFactory,
    notebookTracker: INotebookTracker,
  ) => {
    commands.addCommand("datalogger-jupyterlab:add-datalogger-load-code", {
      label: "Add DataLogger Load Code",
      caption:
        "Add code to the current notebook that loads the selected logs with DataLogger.",
      icon: addIcon,
      execute: async () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser === null) return;
        const files = [...fileBrowser.selectedItems()];

        // Get the current notebook
        let { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        const {
          content: notebook,
          context: { path: notebookPath },
        } = notebookPanel;

        // Create a new cell with the load code
        NotebookActions.insertBelow(notebook);
        addToActiveCell(notebook, generateLoadCode(files, notebookPath));
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

    commands.addCommand("datalogger-jupyterlab:new-datalogger-notebook", {
      label: "New DataLogger Notebook",
      caption:
        "Create new notebook with code that loads the selected logs with DataLogger.",
      icon: notebookIcon,
      execute: async () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser === null) return null;
        const files = [...fileBrowser.selectedItems()].filter(({ mimetype }) =>
          logMimetypes.has(mimetype),
        );

        // Get the name of the first kernel
        await serviceManager.ready;
        const {
          kernelspecs: { specs },
        } = serviceManager;
        const kernelName = specs !== null ? Object.keys(specs.kernelspecs)[0] : undefined;

        // Create a new notebook using that kernel
        await commands.execute("notebook:create-new", { kernelName });

        // Get the current notebook
        let { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        const {
          content: notebook,
          context: { path: notebookPath },
        } = notebookPanel;

        // Reveal the notebook (for some reason, this step, and conducting this step as
        // a command rather than using IDocumentManager, appears to be necessary for
        // editing cells in the new notebook).
        await commands.execute("docmanager:open", { path: notebookPath });

        // Add imports, load code (if any files are selected), and a blank cell
        await notebook.activeCell?.ready;
        addToActiveCell(notebook, "from datalogger import load_log");
        if (files.length > 0) {
          NotebookActions.insertBelow(notebook);
          await notebook.activeCell?.ready;
          addToActiveCell(notebook, generateLoadCode(files, notebookPath));
        }
        NotebookActions.insertBelow(notebook);
      },
    });
  },
};

export default dataloggerLoadCodePlugin;
