import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { PACKAGE_NAME, NETCDF_MIMETYPE } from "@/constants";
import { borderAllIcon } from "@/icons";

/**
 * Plugin that makes JupyterLab recognize the NetCDF file type, allowing context menu
 * plugins to target that file type with CSS selectors, and causing an icon to appear.
 *
 * Note that this plugin does not allow NetCDF files to be previewed.
 */
export const netcdfFileTypePlugin: JupyterFrontEndPlugin<void> = {
  id: `${PACKAGE_NAME}:netcdf-file-type-plugin`,
  description: "Adds NetCDF file type.",
  autoStart: true,
  activate({ docRegistry }: JupyterFrontEnd) {
    if (docRegistry.getFileType("netcdf") === undefined) {
      docRegistry.addFileType({
        name: "netcdf",
        displayName: "NetCDF File",
        extensions: [".nc"],
        mimeTypes: [NETCDF_MIMETYPE],
        contentType: "file",
        fileFormat: "base64",
        icon: borderAllIcon,
      });
    }
  },
};

export default netcdfFileTypePlugin;
