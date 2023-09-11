import { Notebook } from "@jupyterlab/notebook";

export default async function addToActiveCell(notebook: Notebook, text: string) {
  const { activeCell } = notebook;
  if (activeCell !== null) {
    await activeCell.ready;
    const { editor } = activeCell;
    if (editor?.replaceSelection !== undefined) {
      editor.replaceSelection(text);
    }
  }
}
