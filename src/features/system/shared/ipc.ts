export enum SystemIpc {
    SelectPath = "system:select-path",
    OpenPath = "system:open-path",
    OpenExternal = "system:open-external",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [SystemIpc.SelectPath]: (opt?: { type?: "folder" | "file" }) => string | undefined,
        [SystemIpc.OpenPath]: (path: string) => void,
        [SystemIpc.OpenExternal]: (url: string) => void,
    }
}