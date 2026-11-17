import { injectable } from "tsyringe";
import { handle, type Initializable } from "#features/base/main";
import { WindowControlsIpc } from "../shared";


@injectable()
export class WindowControlsService implements Initializable {
    public initialize() {
        handle(WindowControlsIpc.Close, ({ window }) => window?.close());
        handle(WindowControlsIpc.Minimize, ({ window }) => window?.minimize());
        handle(WindowControlsIpc.ToggleMaximize, ({ window }) => {
            if (!window) return;
            if (window.isMaximized()) window.restore();
            else window.maximize();;
        });
    }
}