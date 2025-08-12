import fs from "fs";
import path from "path";
import { BrowserWindow, dialog, ipcMain, shell } from "electron";
import UserConfigStore from "../store/UserConfigStore";
import Local from "../localization";
import { Pathes } from "@Main/Pathes";
import Localize from "@Common/Localize";
import ModsConfig from "@Main/store/ModsConfigStore";
import ModPacks from "@Main/services/ModPacks";
import ModListActions from "@Main/services/modListActions";
import GitActions from "@Main/services/gitActions";
import { mkdirIfDontExists } from "@Main/services/fsActions";
import AppAutoUpdater from "@Main/services/autoUpdater";


//#region IPC - handle
const IPCEvents_handle = {

    //#region Window
    async winClose() {
        const win = BrowserWindow.fromWebContents(this.sender);
        win?.close()
    },
    async winMinimize() {
        const win = BrowserWindow.fromWebContents(this.sender);
        win?.minimize()
    },
    async winToggleMaximize() {
        const win = BrowserWindow.fromWebContents(this.sender);
        if (win) win.isMaximized() ? win.restore() : win.maximize()
    },
    async openDevTools() {
        const win = BrowserWindow.fromWebContents(this.sender);
        win?.webContents.openDevTools();
    },



    selectFile(setting: { type: "folder" | "file" }) {
        return dialog.showOpenDialog({
            properties: [
                setting.type == "folder" ? "openDirectory" : "openFile",
                "dontAddToRecent"
            ]
        });
    },
    openPath(path: string) {
        return shell.openPath(path);
    },

    //#endregion



    //#region Mods
    async enableMod(packageId: PackageId) {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods.push(packageId);
        ModsConfig.save(modsConfig);
    },
    async disableMod(packageId: PackageId) {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = modsConfig.activeMods.filter(a => a !== packageId);
        ModsConfig.save(modsConfig);
    },

    async activeModBefore(targetId: PackageId, beforeId: PackageId) {
        const modsConfig = ModsConfig.get();

        if (targetId == beforeId) return;

        const targetIndex = modsConfig.activeMods.indexOf(targetId);
        const beforeIndex = modsConfig.activeMods.indexOf(beforeId);

        if (beforeIndex === -1) {
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
            return;
        }
        if (targetIndex < beforeIndex) {
            modsConfig.activeMods.splice(beforeIndex, 0, targetId);
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
        } else {
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
            modsConfig.activeMods.splice(beforeIndex, 0, targetId);
        }
        ModsConfig.save(modsConfig);
    },
    async activeModAfter(targetId: PackageId, afterId: PackageId) {
        const modsConfig = ModsConfig.get();
        if (targetId == afterId) return;
        const targetIndex = modsConfig.activeMods.indexOf(targetId);
        const afterIndex = modsConfig.activeMods.indexOf(afterId);

        if (afterIndex === -1) {
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
            return;
        }

        if (targetIndex < afterIndex) {
            modsConfig.activeMods.splice(afterIndex + 1, 0, targetId);
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
        } else {
            if (targetIndex !== -1) modsConfig.activeMods.splice(targetIndex, 1);
            modsConfig.activeMods.splice(afterIndex + 1, 0, targetId);
        }
        ModsConfig.save(modsConfig);
    },

    async setActiveMods(list: PackageId[]) {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = list;
        ModsConfig.save(modsConfig);
    },
    async clearModsConfig() {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = ["ludeon.rimworld" as PackageId];
        ModsConfig.save(modsConfig);
    },
    async getModsConfig() {
        return ModsConfig.get();
    },
    getModList: async () => ModListActions.getModList(),
    //#endregion




    getUserConfig: async () => UserConfigStore.get(),
    setUserConfigByKey: async <K extends keyof UserConfig>(key: K, data: UserConfig[K]) => UserConfigStore.set(key, data),

    getUserConfigDebugPathes: async () => await UserConfigStore.DebugPathes(),
    getPathes: async () => ({ ...Pathes }),



    //#region Game
    async runGame() {
        const data = await UserConfigStore.get();
        shell.openExternal("steam://launch/294100");
        if (data.closeWindowAfterRun) {
            const win = BrowserWindow.fromWebContents(this.sender);
            win?.close();
        }
    },

    async getGameInfo() {
        if (!Pathes.Dir_Game) return {
            success: false as const,
            message: Localize("error_gamePathIsUndefined"),
        }

        if (!fs.existsSync(path.join(Pathes.Dir_Game, "Version.txt"))) {
            return {
                success: false as const,
            }
        }

        const gameVersionFull = fs.readFileSync(path.join(Pathes.Dir_Game, "Version.txt")).toString().trim() as FullVersion;
        const gameVersionShort = gameVersionFull.match(/^(\d+\.\d+)./)![1]! as ShortVersion;

        return {
            success: true as const,
            data: {
                gamePath: Pathes.Dir_Game,
                gameVersionFull, gameVersionShort,
            } satisfies GameInfoData
        };
    },
    //#endregion


    //#region Localization
    setLocal: async (newLang: string) => UserConfigStore.set("language", newLang),
    getTargetLocalJSON: async () => Local.getTargetLocal(),
    getAccessLanguages: async () => Local.getAllLanguages(),
    //#endregion




    //#region ModPacks
    async saveModPack(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        ModPacks.save(packName);
    },
    async useModPack(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        ModPacks.use(packName);
    },
    async deleteModPack(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        ModPacks.remove(packName);
    },
    async renameModPack(oldname: string, newname: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        ModPacks.rename(oldname, newname);
    },
    async getModPacksList() {
        return ModPacks.load();
    },
    //#endregion



    //#region Tags
    async hasTag(name: string) {
        const tags = UserConfigStore.get("tags");
        return tags.some(a => a.name == name);
    },
    async setTag(tag: ModTag) {
        const tags = UserConfigStore.get("tags");

        const targetTagInd = tags.findIndex(a => a.name == tag.name);
        if (targetTagInd >= 0) {
            tags.splice(targetTagInd, 1, tag);
        } else {
            tags.push(tag);
        }

        UserConfigStore.set("tags", tags);
    },
    async updateTag<K extends keyof ModTag>(tagname: string, key: K, newvalue: ModTag[K]): Promise<CreateResponse> {
        const tags = UserConfigStore.get("tags");

        const targetTag = tags.find(a => a.name == tagname);
        if (targetTag) {
            targetTag[key] = newvalue;
            UserConfigStore.set("tags", tags);
            return { success: true }
        } else {
            return { success: false, error: "Tag not found" }
        }
    },
    async removeTag(name: string) {
        const tags = UserConfigStore.get("tags");

        const targetTagInd = tags.findIndex(a => a.name == name);
        if (targetTagInd >= 0) {
            tags.splice(targetTagInd, 1);
            UserConfigStore.set("tags", tags);
        }
    },
    //#endregion



    async checkForUpdatesAndNotify() {
        return AppAutoUpdater.checkForUpdatesAndNotify();
    },
} satisfies Record<string, (...args: any[]) => Promise<any>> & ThisType<Electron.IpcMainInvokeEvent>
//#endregion





//#region IPC - on
type IDType = ReturnType<typeof crypto.randomUUID>
type IPC_onCallbackIn<Args extends any[] = [...any]> = (...args: Args) => void;
type IPC_onCallbacks = { [K: string]: IPC_onCallbackIn }
function IPC_on_sendler<Result extends IPC_onCallbacks>(taskid: IDType, channelname: string) {
    function send<cbn extends keyof Result & string>(sender: Electron.WebContents, callbackName: cbn, ...args: Parameters<Result[cbn]>) {
        sender.send(`${channelname}:${callbackName}:${taskid}`, ...args);
    }

    type R = { [K in keyof Result]: (cb: Result[K]) => R }
    send.__Type__ = {} as R;

    return send;
}

const IPCEvents_on = {
    async longTask(taskId) {
        const sendler = IPC_on_sendler<{
            onProgress: IPC_onCallbackIn<[percent: number, message: string]>
            onDone: IPC_onCallbackIn<[void]>
            onError: IPC_onCallbackIn<[message: string]>
        }>(taskId, "longTask");

        for (let i = 0; i <= 100; i += 1) {
            await new Promise((r) => setTimeout(r, 100));
            sendler(this.sender, "onProgress", i / 100, i < 25 ? "Завантаження..." : i < 50 ? "Майже половина..." : i < 75 ? "Продовжуємо..." : i < 100 ? "Майже готово..." : "OK");
        }

        sendler(this.sender, "onDone");

        return sendler.__Type__;
    },

    async downloadGitMod(taskId, url: string) {
        const sendler = IPC_on_sendler<{
            onProgress: IPC_onCallbackIn<[percent: number, message: string]>
            onDone: IPC_onCallbackIn<[void]>
            onError: IPC_onCallbackIn<[message: string]>
        }>(taskId, "downloadGitMod");


        try {
            await GitActions.downloadGitMod({
                url,
                onProgress: (percent, message) => {
                    sendler(this.sender, "onProgress", percent, message)
                },
            });
        } catch (e) {
            sendler(this.sender, "onError", e instanceof Error ? e.message : String(e));
        }

        sendler(this.sender, "onDone");

        return sendler.__Type__;
    },

    async updateGitMod(taskId, pathToGitMod: string) {
        const sendler = IPC_on_sendler<{
            onProgress: IPC_onCallbackIn<[percent: number, message: string]>
            onDone: IPC_onCallbackIn<[void]>
            onError: IPC_onCallbackIn<[message: string]>
        }>(taskId, "updateGitMod");

        try {
            await GitActions.updateGitMod(pathToGitMod, {
                onProgress: (percent, message) => {
                    sendler(this.sender, "onProgress", percent, message)
                },
            });
        } catch (e) {
            sendler(this.sender, "onError", e instanceof Error ? e.message : String(e));
        }

        sendler(this.sender, "onDone");

        return sendler.__Type__;
    },

    async checkForUpdatesAndNotify(taskId) {
        const sendler = IPC_on_sendler<{
            onProgress: IPC_onCallbackIn<[percent: number]>
            onSuccess: IPC_onCallbackIn<[void]>,
            onError: IPC_onCallbackIn<[message: string]>
            onDone: IPC_onCallbackIn<[void]>,
        }>(taskId, "checkForUpdatesAndNotify");

        AppAutoUpdater.downloadAndInstall({
            onProgress: (percent) => sendler(this.sender, "onProgress", percent),
            onCancelled: (info) => sendler(this.sender, "onError", "Cancelled"),
            onDownloaded: (event) => sendler(this.sender, "onSuccess"),
            onError: (error, message) => sendler(this.sender, "onError", message ?? "Unknown Error"),
            onFinish: () => sendler(this.sender, "onDone"),
        });

        return sendler.__Type__;
    },
} satisfies {
    [K: string]: (taskId: IDType, ...args: any[]) => Promise<{
        onDone: any, // Необхідний для вимкнення подій після завершення
    }>
} & ThisType<Electron.IpcMainInvokeEvent>
//#endregion


export type IPCEvents_on = typeof IPCEvents_on;
export type IPCEvents_handle = typeof IPCEvents_handle;




export function InitIPCEvents() {
    for (let name in IPCEvents_handle) {
        ipcMain.handle(name, (event, ...args) => {
            const fn: Function = IPCEvents_handle[name as keyof typeof IPCEvents_handle];
            if (!fn) throw Error(`IPC Method "${name}" not found`);
            return fn.call(event, ...args);
        });
    }
    for (let name in IPCEvents_on) {
        ipcMain.on(name, (event, ...args) => {
            const fn: Function = IPCEvents_on[name as keyof typeof IPCEvents_on];
            if (!fn) throw Error(`IPC Method "${name}" not found`);
            return fn.call(event, ...args);
        });
    }
}