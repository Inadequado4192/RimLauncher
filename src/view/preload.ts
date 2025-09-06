// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, IpcRendererEvent, shell } from "electron";
import type { IPCEvents_handle, IPCEvents_on } from "../main/events/IPCEvents";
import type { FileEvents } from "../main/events/webEvents";

//#region IPC
const internal_invokeProxy = new Proxy({}, {
    get: (target: {}, p: string) => (...args: any[]) => ipcRenderer.invoke(p, ...args)
}) as IPCEvents_handle;

const internal_sendProxy = new Proxy({}, {
    get: (target: {}, channel: string) => (...args: any[]) => {
        const taskId = crypto.randomUUID();

        const callbackCreator = new Proxy({}, {
            get: (target: {}, callbackName: string) => {
                return (callback: any) => {
                    let fullChannel = `${channel}:${callbackName}:${taskId}`
                    ipcRenderer.on(fullChannel, handles[fullChannel] = (e: any, ...args: any[]) => callback(...args));
                    return callbackCreator;
                }
            }
        });

        const handles: Record<string, (event: IpcRendererEvent, ...args: any[]) => void> = {};
        ipcRenderer.once(`${channel}:onDone:${taskId}`, () => { for (const c in handles) ipcRenderer.off(c, handles[c]!); })
        ipcRenderer.send(channel, taskId, ...args);
        return callbackCreator;
    }
    // }) as { [K in keyof typeof IPCEvents_on]: Awaited<typeof IPCEvents_on[K]> };
}) as { [K in keyof IPCEvents_on]: (...args: Parameters<IPCEvents_on[K]> extends [id: string, ...infer P] ? P : []) => Awaited<ReturnType<IPCEvents_on[K]>> };

const internal_onProxy = new Proxy({}, {
    get: (target: {}, channel: string) => (listener: any) => ipcRenderer.on(channel, listener)
}) as { [C in keyof FileEvents]: (listener: (e: Electron.IpcRendererEvent, ...p: FileEvents[C]) => void) => void }
const internal_offProxy = new Proxy({}, {
    get: (target: {}, channel: string) => (listener: any) => ipcRenderer.off(channel, listener)
}) as { [C in keyof FileEvents]: (listener: (e: Electron.IpcRendererEvent, ...p: FileEvents[C]) => void) => void }


declare global {
    type on_listenerType<T extends typeof internal_onProxy[keyof typeof internal_onProxy]> = Parameters<T>[0];
    const $on: typeof internal_onProxy;
    const $off: typeof internal_offProxy;
    const $invoke: typeof internal_invokeProxy;
    const $send: typeof internal_sendProxy;
}
(window as any).$on = internal_onProxy;
(window as any).$off = internal_offProxy;
(window as any).$invoke = internal_invokeProxy;
(window as any).$send = internal_sendProxy;
//#endregion






addEventListener("focusin", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.matches('button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]')) {
        t.blur();
    }
});



declare global {
    const TITLE: string;
}
const appVersion = process.argv.find(arg => arg.startsWith("--appVersion="))?.split("=")[1] || "unknown";
const appName = process.argv.find(arg => arg.startsWith("--appName="))?.split("=")[1] || "unknown";

(window as any).TITLE = `${appName} v${appVersion}`;