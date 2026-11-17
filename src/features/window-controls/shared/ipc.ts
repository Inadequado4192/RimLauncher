export enum WindowControlsIpc {
    Close = "win:close",
    Minimize = "win:minimize",
    ToggleMaximize = "win:toggleMaximize",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [WindowControlsIpc.Close]: () => void;
        [WindowControlsIpc.Minimize]: () => void;
        [WindowControlsIpc.ToggleMaximize]: () => void;
    }
}