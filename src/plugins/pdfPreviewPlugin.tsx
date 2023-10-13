import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { FileBrowser, DirListing, IDefaultFileBrowser } from "@jupyterlab/filebrowser";
import { ReactWidget, UseSignal } from "@jupyterlab/ui-components";
import { ISignal, Signal } from "@lumino/signaling";
import { pdfMimetype } from "@/constants";

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

function PdfComponent({ pdfData }: { pdfData: string | undefined }) {
  return (
    <object
      type={pdfMimetype}
      data={`data:${pdfMimetype};base64,${pdfData ?? ""}`}
      width="100%"
      height="100%"
    />
  );
}

function UseSignalComponent({ signal }: { signal: ISignal<PdfPreview, string> }) {
  return (
    <UseSignal signal={signal}>
      {(_, pdfData) => <PdfComponent pdfData={pdfData} />}
    </UseSignal>
  );
}

class PdfPreview extends ReactWidget {
  constructor() {
    super();
    this.id = "pdf-preview";
    this.title.label = "PDF Preview";
    this.title.closable = true;
  }

  render() {
    return <UseSignalComponent signal={this._updateData} />;
  }

  updateData(newData: string) {
    this._updateData.emit(newData);
  }

  private _updateData = new Signal<this, string>(this);
}

const pdfPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:pdf-preview",
  description: "Preview PDFs in the file browser on hover.",
  autoStart: true,
  requires: [IDefaultFileBrowser],
  activate: (
    { serviceManager, shell }: JupyterFrontEnd,
    { dirListing, content: { node: fileBrowserNode } }: IDefaultFileBrowser,
  ) => {
    const pdfPreview = new PdfPreview();
    let currentPdfContent = "";
    fileBrowserNode.addEventListener("mouseover", ({ target }) => {
      const sortedItems = [...dirListing.sortedItems()];
      dirListing.items.forEach((itemNode, itemIndex) => {
        if (target instanceof Node && itemNode.contains(target)) {
          const { path, mimetype } = sortedItems[itemIndex];
          if (mimetype === pdfMimetype) {
            (async () => {
              const { content } = await serviceManager.contents.get(path);
              if (
                content.length === currentPdfContent.length &&
                content === currentPdfContent
              ) {
                // Content has not changed, so don't rerender
                return;
              }
              currentPdfContent = content;
              pdfPreview.updateData(content);
              if (!pdfPreview.isAttached) {
                shell.add(pdfPreview);
              }
            })();
          }
        }
      });
    });
  },
};

export default pdfPreviewPlugin;
