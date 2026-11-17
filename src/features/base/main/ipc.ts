import { BrowserWindow, ipcMain, WebContents } from "electron";
import { IpcInvokeMap, IpcEventMap } from "../shared";


export interface IpcContext {
    sender: WebContents;
    window: BrowserWindow | null;
}

export function handle<K extends keyof IpcInvokeMap>(
    channel: K,
    fn: (ctx: IpcContext, ...args: Parameters<IpcInvokeMap[K]>)
        => ReturnType<IpcInvokeMap[K]> | Promise<ReturnType<IpcInvokeMap[K]>>
) {
    ipcMain.handle(channel, (e, ...args) =>
        fn({ sender: e.sender, window: BrowserWindow.fromWebContents(e.sender) }, ...(args as any)));
    return () => ipcMain.removeHandler(channel);
}


export function emit<K extends keyof IpcEventMap>(
    win: BrowserWindow, channel: K, ...args: Parameters<IpcEventMap[K]>
) {
    win.webContents.send(channel, ...args);
}
export function emitAll<K extends keyof IpcEventMap>(
    channel: K, ...args: Parameters<IpcEventMap[K]>
) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) win.webContents.send(channel, ...args);
    }
}
