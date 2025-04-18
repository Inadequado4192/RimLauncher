// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, shell } from "electron";
import type { IPCEvents } from "../main/Events/IPCEvents";
import type { FileEvents } from "../main/Events/WebEvents";
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


// function internal_invoke<C extends keyof typeof IPCEvents>(
//     channel: C,
//     ...args: Parameters<typeof IPCEvents[C]> extends [any, ...infer P] ? P : []
// ) { return ipcRenderer.invoke(channel, ...args) as Promise<Awaited<ReturnType<typeof IPCEvents[C]>>> }


const internal_invokeProxy = new Proxy({}, {
    get: (target: {}, p: string) => (...args: any[]) => ipcRenderer.invoke(p, ...args)
}) as { [C in keyof typeof IPCEvents]: (...args: Parameters<typeof IPCEvents[C]> extends [any, ...infer P] ? P : []) => Promise<Awaited<ReturnType<typeof IPCEvents[C]>>> }

const internal_onProxy = new Proxy({}, {
    get: (target: {}, channel: string) => (listener: any) => ipcRenderer.on(channel, listener)
}) as
    & { [C in keyof FileEvents]: (listener: (e: Electron.IpcRendererEvent, ...p: FileEvents[C]) => void) => void }
// & { [C in keyof FileEvents as `${C}_listenerType`]: (e: Electron.IpcRendererEvent, ...p: FileEvents[C]) => void }

const internal_offProxy = new Proxy({}, {
    get: (target: {}, channel: string) => (listener: any) => ipcRenderer.off(channel, listener)
}) as { [C in keyof FileEvents]: (listener: (e: Electron.IpcRendererEvent, ...p: FileEvents[C]) => void) => void }


declare global {
    // /**@deprecated */
    // const old_invoke: typeof internal_invoke;
    type on_listenerType<T extends typeof internal_onProxy[keyof typeof internal_onProxy]> = Parameters<T>[0];
    const on: typeof internal_onProxy;
    const off: typeof internal_offProxy;
    const invoke: typeof internal_invokeProxy
}


// (window as any).old_invoke = internal_invoke;
(window as any).invoke = internal_invokeProxy;
(window as any).on = internal_onProxy;
(window as any).off = internal_offProxy;







addEventListener("keydown", function (e) {
    if (e.code == "Tab") e.preventDefault();
});

addEventListener("click", (e) => {
    const target = e.target as HTMLAnchorElement;
    if (target.tagName === "A" && target.href.startsWith("http")) {
        e.preventDefault();
        shell.openExternal(target.href);
    }
});



// console.log("Pathes", {
//     "process.resourcesPath": process.resourcesPath,
//     "__dirname": __dirname,
//     "path.resolve(\"./\")": path.resolve("./")
// });
