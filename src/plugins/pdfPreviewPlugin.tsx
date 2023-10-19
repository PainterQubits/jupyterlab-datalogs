import { useState, useEffect } from "react";
import { pdfjs, Document, Thumbnail } from "react-pdf";
import { ISignal, Signal } from "@lumino/signaling";
import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { Contents } from "@jupyterlab/services";
import { FileBrowser, DirListing, IDefaultFileBrowser } from "@jupyterlab/filebrowser";
import { ReactWidget, UseSignal } from "@jupyterlab/ui-components";
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
  width: 200,
  borderWidth: 1,
  gap: 10,
} as const;

function calcPosition(
  clientX: number,
  clientY: number,
  parent: Element,
  previewHeightWithoutBorders: number,
) {
  const {
    top: parentTop,
    left: parentLeft,
    width: maxX,
    height: maxY,
  } = parent.getBoundingClientRect();
  const x = clientX - parentLeft;
  const y = clientY - parentTop;

  const { width: previewWidthWithoutBorders, borderWidth, gap } = pdfPreviewConstants;
  const previewWidth = previewWidthWithoutBorders + 2 * borderWidth;
  const previewHeight = previewHeightWithoutBorders + 2 * borderWidth;
  const previewWidthWithGap = previewWidth + gap;
  const previewHeightWithGap = previewHeight + gap;

  const top =
    y + previewHeightWithGap > maxY ? Math.max(y - previewHeightWithGap, 0) : y + gap;

  let left = Math.max(x - previewWidthWithGap, 0);

  const hide = () =>
    x >= left && x <= left + previewWidth && y >= top && y <= top + previewHeight;

  if (hide()) {
    left = Math.min(x + gap, maxX - previewWidth);
  }

  return { top, left, hide: hide() };
}

type PdfComponentProps = {
  pdfData: string;
  clientX: number;
  clientY: number;
  parent: Element;
};

function PdfComponent({ pdfData, clientX, clientY, parent }: PdfComponentProps) {
  const { width, borderWidth } = pdfPreviewConstants;

  const [renderedHeight, setRenderedHeight] = useState<number | null>(null);

  useEffect(() => {
    setRenderedHeight(null);
  }, [pdfData]);

  let top: number | undefined;
  let left: number | undefined;
  let hide = true;
  if (renderedHeight !== null) {
    ({ top, left, hide } = calcPosition(clientX, clientY, parent, renderedHeight));
  }

  const documentContainerStyle = {
    display: hide ? "none" : undefined,
    position: "fixed",
    top,
    left,
    zIndex: 100,
    overflow: "hidden",
    width,
    border: `${borderWidth}px solid var(--jp-border-color1)`,
    background: "white",
  } as const;

  return (
    <div style={documentContainerStyle}>
      <Document file={`data:${pdfMimetype};base64,${pdfData}`}>
        <Thumbnail
          pageNumber={1}
          width={pdfPreviewConstants.width}
          onRenderSuccess={({ height }: { height: number }) => setRenderedHeight(height)}
        />
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

  updatePosition(clientX: number, clientY: number, parent: Element) {
    this._props.clientX = clientX;
    this._props.clientY = clientY;
    this._props.parent = parent;
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
              clientX,
              clientY,
              parent: fileBrowserNode,
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
        pdfPreview.updatePosition(clientX, clientY, fileBrowserNode);
      }
    });
  },
};

export default pdfPreviewPlugin;
