import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { Contents } from "@jupyterlab/services";
import { FileBrowser, DirListing, IDefaultFileBrowser } from "@jupyterlab/filebrowser";
import { ReactWidget, UseSignal } from "@jupyterlab/ui-components";
import { ISignal, Signal } from "@lumino/signaling";
import { pdfjs, Document, Page } from "react-pdf";
import { pdfMimetype } from "@/constants";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.js?file";

// Set the URL for the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

declare module "@jupyterlab/filebrowser" {
  interface FileBrowser {
    /** The DirListing for this FileBrowser. */
    get dirListing(): DirListing;
  }

  interface DirListing {
    /** Models for items in the DirListing. */
    get itemModels(): Contents.IModel[];

    /** Nodes for items in the DirListing. */
    get itemNodes(): HTMLElement[];
  }
}

// Add a getter method to access the DirListing for a FileBrowser
Object.defineProperty(FileBrowser.prototype, "dirListing", {
  get() {
    return this.listing;
  },
});

// Add a getter method to access the models for items in the DirListing
Object.defineProperty(DirListing.prototype, "itemModels", {
  get() {
    return this._sortedItems;
  },
});

// Add a getter method to access the Nodes for items in the DirListing
Object.defineProperty(DirListing.prototype, "itemNodes", {
  get() {
    return this._items;
  },
});

const pdfPreviewConstants = {
  width: 150,
  height: 150,
  borderWidth: 1,
  gap: 10,
};

function calcPosition(clientX: number, clientY: number, parent: Element) {
  const {
    top: parentTop,
    left: parentLeft,
    width: maxX,
    height: maxY,
  } = parent.getBoundingClientRect();
  const x = clientX - parentLeft;
  const y = clientY - parentTop;

  const {
    width: previewWidthWithoutBorders,
    height: previewHeightWithoutBorders,
    borderWidth,
    gap,
  } = pdfPreviewConstants;
  const previewWidth = previewWidthWithoutBorders + 2 * borderWidth;
  const previewHeight = previewHeightWithoutBorders + 2 * borderWidth;
  const previewWidthWithGap = previewWidth + gap;
  const previewHeightWithGap = previewHeight + gap;

  const left =
    x + previewWidthWithGap > maxX && x >= previewWidthWithGap
      ? x - previewWidthWithGap
      : Math.min(x + gap, maxX - previewWidth);

  const top =
    y + previewHeightWithGap > maxY && y >= previewHeightWithGap
      ? y - previewHeightWithGap
      : Math.min(y + gap, maxY - previewHeight);

  const hide =
    x >= left && x <= left + previewWidth && y >= top && y <= top + previewHeight;

  return { top, left, hide };
}

type PdfComponentProps = {
  pdfData: string;
  top: number;
  left: number;
  hide: boolean;
};

function PdfComponent({ pdfData, top, left, hide }: PdfComponentProps) {
  const { width, height, borderWidth } = pdfPreviewConstants;

  return (
    <div
      style={{
        display: hide ? "none" : undefined,
        position: "fixed",
        top,
        left,
        zIndex: 100,
        overflow: "hidden",
        width,
        height,
        border: `${borderWidth}px solid var(--jp-border-color1)`,
        background: "white",
      }}
    >
      <Document file={`data:${pdfMimetype};base64,${pdfData}`}>
        <Page pageNumber={1} />
      </Document>
    </div>
  );
}

type UseSignalPdfComponentProps = {
  update: ISignal<PdfPreview, void>;
  props: PdfComponentProps;
};

function UseSignalPdfComponent({ update, props }: UseSignalPdfComponentProps) {
  return <UseSignal signal={update}>{() => <PdfComponent {...props} />}</UseSignal>;
}

class PdfPreview extends ReactWidget {
  constructor(pdfComponentProps: PdfComponentProps) {
    super();
    this._props = pdfComponentProps;
  }

  protected render() {
    return <UseSignalPdfComponent update={this._update} props={this._props} />;
  }

  updateData(data: string) {
    this._props.pdfData = data;
    this._update.emit();
  }

  updatePosition({ top, left, hide }: { top: number; left: number; hide: boolean }) {
    this._props.top = top;
    this._props.left = left;
    this._props.hide = hide;
    this._update.emit();
  }

  private _props: PdfComponentProps;
  private _update = new Signal<this, void>(this);
}

const pdfPreviewPlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:pdf-preview",
  description: "Preview PDFs in the file browser on hover.",
  autoStart: true,
  requires: [IDefaultFileBrowser],
  activate: ({ serviceManager }: JupyterFrontEnd, fileBrowser: IDefaultFileBrowser) => {
    const { dirListing, node: fileBrowserNode } = fileBrowser;

    const pdfState: {
      pdfPreview: PdfPreview | null;
      currentPdfPath: string | null;
    } = { pdfPreview: null, currentPdfPath: null };

    fileBrowserNode.addEventListener("mouseover", ({ target, clientX, clientY }) => {
      const { itemNodes, itemModels } = dirListing;

      let pdfPath: string | null = null;
      if (target instanceof Node) {
        for (let i = 0; i < itemNodes.length; ++i) {
          if (itemNodes[i].contains(target)) {
            const { path, mimetype } = itemModels[i];
            if (mimetype === pdfMimetype) {
              pdfPath = path;
              break;
            }
          }
        }
      }

      if (pdfPath === pdfState.currentPdfPath) {
        return;
      }
      pdfState.currentPdfPath = pdfPath;

      if (pdfPath !== null) {
        (async () => {
          const { content } = await serviceManager.contents.get(pdfPath);

          // Since fetching the file content is asynchronous, we check that we are still
          // hovering over the same PDF file before continuing.
          if (typeof content !== "string" || pdfPath !== pdfState.currentPdfPath) {
            return;
          }

          const { pdfPreview } = pdfState;
          if (pdfPreview === null || pdfPreview.isDisposed) {
            const newPdfPreview = new PdfPreview({
              pdfData: content,
              ...calcPosition(clientX, clientY, fileBrowserNode),
            });
            fileBrowser.addWidget(newPdfPreview);
            pdfState.pdfPreview = newPdfPreview;
          } else {
            pdfPreview.updateData(content);
          }
        })();
      } else if (pdfState.pdfPreview !== null && !pdfState.pdfPreview.isDisposed) {
        pdfState.pdfPreview.dispose();
      }
    });

    fileBrowserNode.addEventListener("mouseleave", () => {
      pdfState.currentPdfPath = null;

      const { pdfPreview } = pdfState;
      if (pdfPreview !== null && !pdfPreview.isDisposed) {
        pdfPreview.dispose();
      }
    });

    fileBrowserNode.addEventListener("mousemove", ({ clientX, clientY }) => {
      const { pdfPreview } = pdfState;
      if (pdfPreview !== null && !pdfPreview.isDisposed) {
        pdfPreview.updatePosition(calcPosition(clientX, clientY, fileBrowserNode));
      }
    });
  },
};

export default pdfPreviewPlugin;
