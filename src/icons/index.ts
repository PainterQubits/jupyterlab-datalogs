import { LabIcon } from "@jupyterlab/ui-components";
import chartLineSvgstring from "./chart-line.svg";

export const chartLineIcon = new LabIcon({
  name: "datalogger-jupyterlab:chart-line",
  svgstr: chartLineSvgstring,
});

import chartLineIconUrl from "./chart-line.svg?url";

export { chartLineIconUrl };
