export enum ElectronIpc {
    GetAppInfo = "electron:get-app-info",
    CloseWindow = "electron:close-win",
    MinimizeWindow = "electron:minimize-win",
    ToggleMaximizeWindow = "electron:toggleMaximize-win",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [ElectronIpc.GetAppInfo]: () => { name: string; version: string };
        [ElectronIpc.CloseWindow]: () => void;
        [ElectronIpc.MinimizeWindow]: () => void;
        [ElectronIpc.ToggleMaximizeWindow]: () => void;
    }
}