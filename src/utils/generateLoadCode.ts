import { FileInfo } from "@/types";

export default function generateLoadCode(files: FileInfo[]) {
  const lines = files.map(({ name, path }) => {
    const varName = name.split(".")[0].replaceAll("-", "_");
    return `${varName}_log = load_log("${path}")`;
  });

  return lines.join("\n");
}
