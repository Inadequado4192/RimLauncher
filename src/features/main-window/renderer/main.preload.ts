import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipc", {
    invoke: (channel: string, ...args: unknown[]) =>
        ipcRenderer.invoke(channel, ...args),

    on: (channel: string, cb: (...args: any[]) => void) => {
        const handler = (_: unknown, ...a: any[]) => cb(...a);
        ipcRenderer.on(channel, handler);
        return () => ipcRenderer.removeListener(channel, handler);
    },
});