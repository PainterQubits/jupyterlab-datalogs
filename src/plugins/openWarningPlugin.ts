import path from "path";
import { Awareness } from "y-protocols/awareness";
import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { User } from "@jupyterlab/services";
import { IGlobalAwareness } from "@jupyter/collaboration";
import { showDialog, Dialog } from "@jupyterlab/apputils";

/** State within the awareness object. */
type AwarenessState = {
  user?: User.IIdentity;
  current?: string | null;
  timestamp?: number;
};

/**
 * Plugin that displays a warning dialog when opening a file that another user has open.
 */
const openWarningPlugin: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-datalogger:open-warning",
  description:
    "Displays a warning dialog when opening a file that another user has open.",
  autoStart: true,
  requires: [IDocumentManager, IGlobalAwareness],
  activate: (
    _app: JupyterFrontEnd,
    docManager: IDocumentManager,
    awareness: Awareness,
  ) => {
    /**
     * Saved string corresponding to the current document, or null if not on a document.
     */
    let savedCurrent: string | null = null;

    /**
     * Saved timestamp for when the current document was opened. If another user has the
     * file open, this will be compared against their timestamp to determine whether to
     * display a warning dialog. If null, then no warning dialog will be displayed.
     */
    let savedTimestamp: number | null = null;

    /**
     * Whether there is currently a warning dialog open, to prevent additional dialogs
     * from being opened simultaneously.
     */
    let dialogIsOpen = false;

    awareness.on("change", async () => {
      const states: Map<number, AwarenessState> = awareness.getStates();
      const myClientID = awareness.clientID;
      const myCurrent = states.get(myClientID)?.current ?? null;

      // If the current document is different than the saved document, update the saved
      // document and timestamp, and update the timestamp in the awareness; otherwise,
      // display a warning dialog if another user has the same document open with an older
      // timestamp
      if (myCurrent !== savedCurrent) {
        savedCurrent = myCurrent;
        savedTimestamp = Date.now();
        awareness.setLocalStateField("timestamp", savedTimestamp);
      } else if (!dialogIsOpen && savedCurrent !== null && savedTimestamp !== null) {
        // Find the oldest state among other users who are on the same document and have
        // an older timestamp. (The purpose of finding the user with the *oldest*
        // timestamp, not just *an* older timestamp, is to display the name of the user
        // with the highest priority in the dialog warning message.)
        let oldestState: {
          clientID: number;
          user?: User.IIdentity;
          timestamp: number;
        } | null = null;
        for (const [clientID, { user, current, timestamp }] of states) {
          if (
            current === savedCurrent &&
            timestamp !== undefined &&
            clientID !== myClientID &&
            savedTimestamp >= timestamp &&
            (oldestState === null || oldestState.timestamp > timestamp)
          ) {
            oldestState = {
              clientID,
              user,
              timestamp,
            };
          }
        }

        // If another user on the same document has an older timestamp, display a dialog
        // warning message
        if (oldestState !== null) {
          const { clientID, user } = oldestState;
          const pathComponents = savedCurrent.split(":");
          const filename = path.basename(pathComponents[2]);

          // Prevent other dialogs from being opened simultaneously
          dialogIsOpen = true;

          // Display the warning dialog
          const {
            button: { accept },
          } = await showDialog({
            title: "File already open",
            body:
              `${user?.name ?? clientID} already has "${filename}" open. Would you like` +
              " to close this file to avoid conflicts?",
            buttons: [
              Dialog.cancelButton({ label: "Keep Open" }),
              Dialog.okButton({ label: "Close" }),
            ],
          });

          // Setting the saved timestamp to null prevents additional dialogs for being
          // shown until the user switches away and back to this file
          savedTimestamp = null;

          // If "Close" was selected, attempt to close the file
          if (accept) {
            await docManager.closeFile(pathComponents.slice(1).join(":"));
          }

          // Allow future dialogs to be opened
          dialogIsOpen = false;
        }
      }
    });
  },
};

export default openWarningPlugin;
