import applyModifications from "@/modifications";
import {
  netcdfFileTypePlugin,
  dataloggerLoadCodePlugin,
  pdfPreviewPlugin,
} from "@/plugins";

applyModifications();

export default [netcdfFileTypePlugin, dataloggerLoadCodePlugin, pdfPreviewPlugin];
