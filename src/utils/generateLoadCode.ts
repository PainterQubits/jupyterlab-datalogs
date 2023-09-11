import path from "path";
import { FileInfo } from "@/types";

export default function generateLoadCode(files: FileInfo[], notebookPath: string) {
  const lines = files.map(({ name, path: filePath }) => {
    const varName = name.split(".")[0].replaceAll("-", "_");
    const relativeFilePath = path.relative(path.dirname(notebookPath), filePath);
    return `${varName}_log = load_log("${relativeFilePath}")`;
  });

  return lines.join("\n");
}
