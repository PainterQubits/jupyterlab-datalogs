import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { borderAllIcon } from "@/icons";

/**
 * Plugin that makes JupyterLab recognize the NetCDF file type, allowing context menu
 * plugins to target that file type with CSS selectors, and causing an icon to appear.
 *
 * Note that this plugin does not allow NetCDF files to be previewed.
 */
const netcdfFileTypePlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:netcdf-file-type",
  description: "Adds NetCDF file type.",
  autoStart: true,
  activate: ({ docRegistry }: JupyterFrontEnd) => {
    if (docRegistry.getFileType("netcdf") === undefined) {
      docRegistry.addFileType({
        name: "netcdf",
        displayName: "NetCDF File",
        extensions: [".nc"],
        mimeTypes: ["application/x-netcdf"],
        contentType: "file",
        fileFormat: "base64",
        icon: borderAllIcon,
      });
    }
  },
};

export default netcdfFileTypePlugin;
