import path from "path";
import { Awareness } from "y-protocols/awareness";
import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import { IDocumentManager } from "@jupyterlab/docmanager";
import { User } from "@jupyterlab/services";
import { IGlobalAwareness } from "@jupyter/collaboration";
import { showDialog, Dialog } from "@jupyterlab/apputils";

type AwarenessState = {
  user?: User.IIdentity;
  current?: string | null;
  timestamp?: number;
};

const openWarningPlugin: JupyterFrontEndPlugin<void> = {
  id: "datalogger-jupyterlab:open-warning",
  description: "Displays a warning when opening a file that another user has open.",
  autoStart: true,
  requires: [IDocumentManager, IGlobalAwareness],
  activate: (
    _app: JupyterFrontEnd,
    docManager: IDocumentManager,
    awareness: Awareness,
  ) => {
    let savedCurrent: string | null = null;
    let savedTimestamp: number | null = null;
    let dialogIsOpen = false;

    awareness.on("change", async () => {
      console.log(new Map(awareness.getStates()));
      console.log(`Timestamp is ${savedTimestamp}`);

      const states: Map<number, AwarenessState> = awareness.getStates();
      const myClientID = awareness.clientID;
      const myCurrent = states.get(myClientID)?.current ?? null;
      if (myCurrent !== savedCurrent) {
        savedCurrent = myCurrent;
        savedTimestamp = Date.now();
        awareness.setLocalStateField("timestamp", savedTimestamp);
      } else if (!dialogIsOpen && savedCurrent !== null && savedTimestamp !== null) {
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

        if (oldestState !== null) {
          const { clientID, user } = oldestState;
          const pathComponents = savedCurrent.split(":");
          const filename = path.basename(pathComponents[2]);
          dialogIsOpen = true;
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
          savedTimestamp = null;
          if (accept) {
            await docManager.closeFile(pathComponents.slice(1).join(":"));
          }
          dialogIsOpen = false;
        }
      }
    });
  },
};

export default openWarningPlugin;
