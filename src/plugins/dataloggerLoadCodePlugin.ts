import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
import { addIcon, notebookIcon } from "@jupyterlab/ui-components";
import { generateLoadCode } from "@/utils";

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
  requires: [IFileBrowserFactory, IDocumentManager, INotebookTracker],
  activate: (
    { commands, serviceManager }: JupyterFrontEnd,
    { tracker: fileBrowserTracker }: IFileBrowserFactory,
    documentManager: IDocumentManager,
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

        // Get the current notebook
        let { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        const notebook = notebookPanel.content;

        // Reveal the notebook
        documentManager.openOrReveal(notebookPanel.context.path);

        // Create a new cell with the load code
        NotebookActions.insertBelow(notebook);
        const { activeCell } = notebook;
        if (activeCell !== null) {
          await activeCell.ready;
          const { editor } = activeCell;
          if (editor?.replaceSelection !== undefined) {
            editor.replaceSelection(generateLoadCode([...fileBrowser.selectedItems()]));
          }
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

    commands.addCommand("datalogger-jupyterlab:new-datalogger-notebook", {
      label: "New DataLogger Notebook",
      caption:
        "Create new notebook with code that loads the selected logs with DataLogger.",
      icon: notebookIcon,
      execute: async () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser === null) return null;
        const files = [...fileBrowser.selectedItems()];

        // Get the name of the first kernel
        await serviceManager.ready;
        const {
          kernelspecs: { specs },
        } = serviceManager;
        const kernelName = specs !== null ? Object.keys(specs.kernelspecs)[0] : undefined;

        // Create a new notebook using that kernel
        await commands.execute("notebook:create-new", { cwd: ".", kernelName });

        // Get the current notebook
        let { currentWidget: notebookPanel } = notebookTracker;
        if (notebookPanel === null) return;
        const notebook = notebookPanel.content;

        // Reveal the notebook (for some reason, this step, and conducting this step as
        // a command rather than using IDocumentManager, appears to be necessary for
        // editing cells in the new notebook).
        await commands.execute("docmanager:open", { path: notebookPanel.context.path });

        // Add imports, load code, and a blank cell
        if (notebook.activeCell !== null) {
          const { activeCell } = notebook;
          await activeCell.ready;
          const { editor } = activeCell;
          if (editor?.replaceSelection !== undefined) {
            editor.replaceSelection("from datalogger import load_log");
          }
        }
        NotebookActions.insertBelow(notebook);
        if (notebook.activeCell !== null) {
          const { activeCell } = notebook;
          await activeCell.ready;
          const { editor } = activeCell;
          if (editor?.replaceSelection !== undefined) {
            editor.replaceSelection(generateLoadCode(files));
          }
        }
        NotebookActions.insertBelow(notebook);
      },
      isVisible: () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        return (
          fileBrowser !== null &&
          [...fileBrowser.selectedItems()].every(({ mimetype }) =>
            logMimetypes.has(mimetype),
          )
        );
      },
    });
  },
};

export default dataloggerLoadCodePlugin;
