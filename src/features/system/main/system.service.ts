import { handle, Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { SystemIpc } from "../shared";
import { dialog, shell } from "electron";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "steam:"]);


@injectable()
export class SystemService implements Initializable {
    public initialize(): Promise<void> | void {
        handle(SystemIpc.OpenPath, (_, path) => {
            shell.openPath(path);
        });

        handle(SystemIpc.SelectPath, async (_, opt) => {
            const a = await dialog.showOpenDialog({
                properties: [
                    opt?.type === "folder" ? "openDirectory" : "openFile",
                    "dontAddToRecent"
                ]
            });
            if (a.canceled) return;
            return a.filePaths[0];
        });

        handle(SystemIpc.OpenExternal, async (_, url) => {
            const protocol = new URL(url).protocol;
            if (!ALLOWED_PROTOCOLS.has(protocol)) return;
            await shell.openExternal(url);
        });
    }

}