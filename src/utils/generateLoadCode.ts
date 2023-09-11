import path from "path";
import { NotebookPanel } from "@jupyterlab/notebook";
import { FileInfo } from "@/types";

const varSuffix = "_log";

export default function generateLoadCode(
  files: FileInfo[],
  notebookPanel: NotebookPanel,
) {
  const {
    context: { path: notebookPath },
  } = notebookPanel;

  let existingCode = notebookPanel.model?.toString();

  const lines = files.map(({ name, path: filePath }) => {
    // Find a unique variable name (one not already present in the code)
    const varBase = name.split(".")[0].replaceAll("-", "_");
    let varName = `${varBase}${varSuffix}`;
    let varIndex = 1;
    while (existingCode?.includes(varName)) {
      varName = `${varBase}${varSuffix}_${varIndex}`;
      varIndex += 1;
    }

    // Generate the rest of the code line and add to existing code
    const relativeFilePath = path.relative(path.dirname(notebookPath), filePath);
    const loadCode = `${varName} = load_log("${relativeFilePath}")`;
    existingCode += `\n${loadCode}`;
    return loadCode;
  });

  return lines.join("\n");
}
