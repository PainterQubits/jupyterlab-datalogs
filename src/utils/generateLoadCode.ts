import path from "path";
import { NotebookPanel } from "@jupyterlab/notebook";
import { FileInfo } from "@/types";
import { jsonMimetype, netcdfMimetype } from "@/constants";

const varSuffix = "_log";

export default function generateLoadCode(
  fileInfo: FileInfo,
  notebookPanel: NotebookPanel,
) {
  const { name, path: filePath, mimetype } = fileInfo;
  const {
    context: { path: notebookPath },
  } = notebookPanel;

  // Find a unique variable name (one not already present in the code)
  const existingCode = notebookPanel.model?.toString();
  const varBase = name.split(".")[0].replaceAll("-", "_");
  let varName = `${varBase}${varSuffix}`;
  let varIndex = 1;
  while (existingCode?.includes(varName)) {
    varName = `${varBase}${varSuffix}_${varIndex}`;
    varIndex += 1;
  }

  // Generate the load code
  const relativeFilePath = path.relative(path.dirname(notebookPath), filePath);
  let loadCode = `${varName} = load_log("${relativeFilePath}")`;

  // Add preview code (specific to log type)
  if (mimetype === jsonMimetype) {
    loadCode += `
print(${varName}.data)`;
  } else if (mimetype === netcdfMimetype) {
    loadCode += `
for var_name in ${varName}.data:
    print(f"${varName}.data[\\"{var_name}\\"]")
    ${varName}.data[var_name].plot()`;
  }

  return loadCode;
}
