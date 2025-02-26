// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";
import type { IPCEvents } from "../../src/main/IPCEvents";
import type { Events } from "../../src/main/Events";
import path from "path";


// const Bridge = {
//     quitApp: () => invoke("quitApp"),
//     selectFile: (settings) => invoke("selectFile", settings),
//     openPath: (path) => invoke("openPath", path),
//     setSetting: (data) => invoke("setSetting", data),
//     getSetting: () => invoke("getSetting"),
//     getModsConfig: () => invoke("getModsConfig"),
//     getModList: () => invoke("getModList"),
// } satisfies {
//     [K in keyof typeof IPCEvents]: (...args: Parameters<typeof IPCEvents[K]>  extends [any, ...infer P] ? P : []) => any
// }


// contextBridge.exposeInMainWorld("electron", Bridge);


function internal_invoke<C extends keyof typeof IPCEvents>(
    channel: C,
    ...args: Parameters<typeof IPCEvents[C]> extends [any, ...infer P] ? P : []
) { return ipcRenderer.invoke(channel, ...args) as Promise<Awaited<ReturnType<typeof IPCEvents[C]>>> }


const internal_invokeProxy = new Proxy({}, {
    get: (target: {}, p: string) => (...args: any[]) => ipcRenderer.invoke(p, ...args)
}) as { [C in keyof typeof IPCEvents]: (...args: Parameters<typeof IPCEvents[C]> extends [any, ...infer P] ? P : []) => Promise<Awaited<ReturnType<typeof IPCEvents[C]>>> }

function internal_on<C extends keyof Events>(
    channel: C,
    listener: (e: Electron.IpcRendererEvent, ...data: Events[C]) => void
) { return ipcRenderer.on(channel, listener) }
function internal_off<C extends keyof Events>(
    channel: C,
    listener: (e: Electron.IpcRendererEvent, ...data: Events[C]) => void
) { return ipcRenderer.off(channel, listener) }


declare global {
    /**@deprecated */
    const old_invoke: typeof internal_invoke;
    const on: typeof internal_on;
    const off: typeof internal_off;

    const invoke: typeof internal_invokeProxy
}
(window as any).old_invoke = internal_invoke;
(window as any).invoke = internal_invokeProxy;
(window as any).on = internal_on;
(window as any).off = internal_off;







addEventListener("keydown", function(e) { 
    if (e.code == "Tab") e.preventDefault();
});


console.log("Pathes", process.resourcesPath, __dirname, path.resolve("./"));
