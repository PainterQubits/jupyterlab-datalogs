import applyModifications from "@/modifications";
import {
  netcdfFileTypePlugin,
  dataloggerLoadCodePlugin,
  pdfPreviewPlugin,
  openWarningPlugin,
} from "@/plugins";

applyModifications();

export default [
  netcdfFileTypePlugin,
  dataloggerLoadCodePlugin,
  pdfPreviewPlugin,
  openWarningPlugin,
];
