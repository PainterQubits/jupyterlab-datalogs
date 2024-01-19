import path from "path";
import { NotebookPanel } from "@jupyterlab/notebook";
import { FileInfo } from "@/types";
import { JSON_MIMETYPE, NETCDF_MIMETYPE } from "@/constants";

const RTC_PREFIX = "RTC:";
const VAR_SUFFIX = "_log";

export function generateLoadCode(fileInfo: FileInfo, notebookPanel: NotebookPanel) {
  const { name, path: filePath, mimetype } = fileInfo;
  const {
    context: { path: notebookPath },
  } = notebookPanel;

  // Find a unique variable name (one not already present in the code)
  const existingCode = notebookPanel.model?.toString();
  const varBase = name.split(".")[0].replaceAll("-", "_");
  let varName = `${varBase}${VAR_SUFFIX}`;
  let varIndex = 1;
  while (existingCode?.includes(varName)) {
    varName = `${varBase}${VAR_SUFFIX}_${varIndex}`;
    varIndex += 1;
  }

  // Generate the load function and preview code depending on log type
  let loadFunction: string;
  let previewCode: string;
  if (mimetype === JSON_MIMETYPE) {
    loadFunction = "DictLog.load";
    previewCode = `
print(${varName}.data)`;
  } else if (mimetype === NETCDF_MIMETYPE) {
    loadFunction = "DataLog.load";
    previewCode = `
for data_var_name in ${varName}.data:
    print(f'${varName}.data["{data_var_name}"]')
    plt.figure()
    ${varName}.data[data_var_name].plot()
    plt.show()`;
  } else {
    loadFunction = "load_log";
    previewCode = "";
  }

  // Get the relative log path, removing the RTC prefix if present
  let relativeFilePath = path.relative(path.dirname(notebookPath), filePath);
  if (relativeFilePath.startsWith(RTC_PREFIX)) {
    relativeFilePath = relativeFilePath.slice(RTC_PREFIX.length);
  }

  // Return load code
  return `${varName} = ${loadFunction}("${relativeFilePath}")${previewCode}`;
}
