import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { FileBrowser, DirListing, IDefaultFileBrowser } from "@jupyterlab/filebrowser";

declare module "@jupyterlab/filebrowser" {
  interface FileBrowser {
    /** The DirListing for this FileBrowser. */
    get dirListing(): DirListing;
  }

  interface DirListing {
    /** Nodes for items in the DirListing. */
    get items(): HTMLElement[];
  }
}

// Add a getter method to access the DirListing for a FileBrowser
Object.defineProperty(FileBrowser.prototype, "dirListing", {
  get() {
    return this.listing;
  },
});

// Add a getter method to access the Nodes for items in the DirListing
Object.defineProperty(DirListing.prototype, "items", {
  get() {
    return this._items;
  },
});

const pdfPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:pdf-preview",
  description: "Preview PDFs in the file browser on hover.",
  autoStart: true,
  requires: [IDefaultFileBrowser],
  activate: (
    _app: JupyterFrontEnd,
    { dirListing, content: { node: fileBrowserNode } }: IDefaultFileBrowser,
  ) => {
    fileBrowserNode.addEventListener("mouseover", ({ target }) => {
      const sortedItems = [...dirListing.sortedItems()];
      dirListing.items.forEach((itemNode, itemIndex) => {
        if (target instanceof Node && itemNode.contains(target)) {
          console.log(`Hovering over ${sortedItems[itemIndex].path}`);
        }
      });
    });
  },
};

export default pdfPreviewPlugin;
