import { LabIcon } from "@jupyterlab/ui-components";
import { PACKAGE_NAME } from "@/constants";
import borderAllSvgstring from "./border-all.svg";
import chartLineSvgstring from "./chart-line.svg";

export const borderAllIcon = new LabIcon({
  name: `${PACKAGE_NAME}:border-all-icon`,
  svgstr: borderAllSvgstring,
});

export const chartLineIcon = new LabIcon({
  name: `${PACKAGE_NAME}:chart-line-icon`,
  svgstr: chartLineSvgstring,
});

export { default as chartLineIconUrl } from "./chart-line.svg?data-url";
