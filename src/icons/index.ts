import { LabIcon } from "@jupyterlab/ui-components";
import borderAllSvgstring from "./border-all.svg";
import chartLineSvgstring from "./chart-line.svg";

export const borderAllIcon = new LabIcon({
  name: "jupyterlab-datalogger:border-all",
  svgstr: borderAllSvgstring,
});

export const chartLineIcon = new LabIcon({
  name: "jupyterlab-datalogger:chart-line",
  svgstr: chartLineSvgstring,
});

export { default as chartLineIconUrl } from "./chart-line.svg?url";
