import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { FileBrowser, DirListing, IDefaultFileBrowser } from "@jupyterlab/filebrowser";
import { ReactWidget, UseSignal } from "@jupyterlab/ui-components";
import { ISignal, Signal } from "@lumino/signaling";
import { pdfMimetype } from "@/constants";
import { pdfjs, Document, Page } from "react-pdf";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.js?file";

// Set the URL for the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

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
  if (pdfData === undefined) return null;

  return (
    <Document file={`data:${pdfMimetype};base64,${pdfData}`}>
      <Page pageNumber={1} />
    </Document>
  );
}

function UseSignalComponent({
  signal,
  data,
}: {
  signal: ISignal<PdfPreview, string>;
  data?: string;
}) {
  return (
    <UseSignal signal={signal} initialArgs={data}>
      {(_, pdfData) => <PdfComponent pdfData={pdfData} />}
    </UseSignal>
  );
}

class PdfPreview extends ReactWidget {
  constructor(data: string) {
    super();
    this.id = "pdf-preview";
    this.title.label = "PDF Preview";
    this.title.closable = true;
    this._data = data;
  }

  protected render() {
    return <UseSignalComponent signal={this._updateData} data={this._data} />;
  }

  updateData(data: string) {
    this._data = data;
    this._updateData.emit(data);
  }

  private _data: string;
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
    let pdfPreview: PdfPreview | null = null;
    let currentPdfPath: string | null = null;
    fileBrowserNode.addEventListener("mouseover", ({ target }) => {
      const sortedItems = [...dirListing.sortedItems()];
      dirListing.items.forEach((itemNode, itemIndex) => {
        if (target instanceof Node && itemNode.contains(target)) {
          const { path, mimetype } = sortedItems[itemIndex];

          if (currentPdfPath === path) return;
          currentPdfPath = path;

          if (mimetype === pdfMimetype) {
            (async () => {
              const { content } = await serviceManager.contents.get(path);

              if (currentPdfPath !== path) return;

              if (!pdfPreview || pdfPreview.isDisposed) {
                pdfPreview = new PdfPreview(content);
              } else {
                pdfPreview.updateData(content);
              }

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
