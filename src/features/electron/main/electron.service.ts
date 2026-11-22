import { injectable } from "tsyringe";
import { handle, type Initializable } from "#features/base/main";
import { ElectronIpc } from "../shared";
import { app } from "electron";


@injectable()
export class ElectronService implements Initializable {
    public initialize() {
        handle(ElectronIpc.GetAppInfo, () => ({ name: app.getName(), version: app.getVersion() }))
        
        handle(ElectronIpc.CloseWindow, ({ window }) => window?.close());
        handle(ElectronIpc.MinimizeWindow, ({ window }) => window?.minimize());
        handle(ElectronIpc.ToggleMaximizeWindow, ({ window }) => {
            if (!window) return;
            if (window.isMaximized()) window.restore();
            else window.maximize();;
        });
    }
}