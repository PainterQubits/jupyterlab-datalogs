import { Notebook, NotebookActions } from "@jupyterlab/notebook";

type AddToNotebookOptions = {
  insertLocation?: "newCellBelow" | "newCellAbove" | "currentCell";
  cellType?: "code" | "markdown" | "raw";
};

export async function addToNotebook(
  notebook: Notebook,
  contents?: string,
  options?: AddToNotebookOptions,
) {
  const { insertLocation = "newCellBelow", cellType = "code" } = options ?? {};

  if (insertLocation === "newCellBelow") {
    NotebookActions.insertBelow(notebook);
  } else if (insertLocation === "newCellAbove") {
    NotebookActions.insertAbove(notebook);
  }

  NotebookActions.changeCellType(notebook, cellType);

  if (contents) {
    const { activeCell } = notebook;
    if (activeCell !== null) {
      await activeCell.ready;
      const { editor } = activeCell;
      if (editor?.replaceSelection !== undefined) {
        editor.replaceSelection(contents);
      }
    }
  }
}
