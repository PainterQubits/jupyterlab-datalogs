import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { NotebookActions, INotebookTracker } from "@jupyterlab/notebook";
import { codeIcon } from "@jupyterlab/ui-components";

const logMimetypes = new Set(["application/json", "application/x-netcdf"]);

/**
 * Along with its corresponding schema (schema/load-with-datalogger.json), this plugin
 * adds an item to the context menu for JSON and NetCDF files that inserts the code needed
 * to load the selected log files using DataLogger into the current notebook.
 *
 * Note that the item appears based on file extension alone, so the given JSON and NetCDF
 * files could be lacking the DataLogger metadata necessary to load it (e.g. if they were
 * not created by DataLogger).
 */
const loadWithDataLoggerPlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:load-with-datalogger",
  description: "Context menu item to copy code to load log files using DataLogger.",
  autoStart: true,
  requires: [IFileBrowserFactory, INotebookTracker],
  activate: (
    { commands }: JupyterFrontEnd,
    { tracker: fileBrowserTracker }: IFileBrowserFactory,
    notebookTracker: INotebookTracker,
  ) => {
    commands.addCommand("datalogger-jupyterlab:open", {
      label: "Load With DataLogger",
      caption:
        "Add code to the current notebook that loads the selected logs with DataLogger.",
      icon: codeIcon,
      mnemonic: 0,
      execute: () => {
        const { currentWidget: fileBrowser } = fileBrowserTracker;
        if (fileBrowser !== null) {
          // Generate code to load logs
          const lines = [...fileBrowser.selectedItems()].map(({ name, path }) => {
            const varName = name.split(".")[0];
            return `${varName}_log = load_log("${path}")`;
          });
          const loadCode = lines.join("\n");

          // Add new cell to the current notebook
          const { currentWidget: notebookPanel } = notebookTracker;
          if (notebookPanel !== null) {
            NotebookActions.insertBelow(notebookPanel.content);
          }

          // Insert code into the new cell
          const { activeCell } = notebookTracker;
          if (activeCell !== null) {
            activeCell.ready.then(() => {
              const { editor } = activeCell;
              if (editor?.replaceSelection !== undefined) {
                console.log(editor.replaceSelection(loadCode));
              }
            });
          }
        }
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

export default loadWithDataLoggerPlugin;
