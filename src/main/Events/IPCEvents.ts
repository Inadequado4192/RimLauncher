import fs from "fs";
import path from "path";
import { dialog, ipcMain, shell } from "electron";
import UserConfig from "../Config";
import Local from "../localization";
import { win } from "..";
import { mkdirIfDontExists, parser } from "../utilts";
import { Pathes } from "src/main/Pathes";
import Localize from "@Common/Localize";
import ModsConfig from "@Tools/ModsConfig";
import ModPacks from "@Tools/ModPacks";
import ModList from "@Tools/ModList";


export const IPCEvents = {
    "winClose": () => win.close(),
    "winMinimize": () => win.minimize(),
    "winToggleMaximize": () => win.isMaximized() ? win.restore() : win.maximize(),

    getPathes: () => ({ ...Pathes }),


    "selectFile": (e, setting: { type: "folder" | "file" }) => {
        return dialog.showOpenDialog({
            properties: [
                setting.type == "folder" ? "openDirectory" : "openFile",
                "dontAddToRecent"
            ]
        });
    },
    "openPath": async (e, path: string) => void await shell.openPath(path),



    enableMod: async (e, packageId: PackageId) => {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods.push(packageId);
        ModsConfig.save(modsConfig);
    },
    activeModBefore: async (e, targetId: PackageId, beforeId: PackageId) => {
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
    activeModAfter: async (e, targetId: PackageId, afterId: PackageId) => {
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
    disableMod: async (e, packageId: PackageId) => {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = modsConfig.activeMods.filter(a => a !== packageId);
        ModsConfig.save(modsConfig);
    },

    setActiveMods: async (e, list: PackageId[]) => {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = list;
        ModsConfig.save(modsConfig);
    },
    async clearModsConfig() {
        const modsConfig = ModsConfig.get();
        modsConfig.activeMods = ["ludeon.rimworld" as PackageId];
        ModsConfig.save(modsConfig);
    },
    getModsConfig: async () => ModsConfig.get(),




    getUserConfig: () => UserConfig.get(),
    getUserConfigByKey: <K extends keyof UserConfig>(e: any, key: K) => UserConfig.get(key),
    setUserConfig: (e, data: UserConfig) => UserConfig.set(data),
    setUserConfigByKey: <K extends keyof UserConfig>(e: any, key: K, data: UserConfig[K]) => UserConfig.set(key, data),

    UserConfigDebug: async () => await UserConfig.Debug(),
    getModList: ModList.getModList.bind(ModList),



    async runGame() {
        // if (!Pathes.Game) return dialog.showErrorBox("Error", Localize("error_gamePathIsUndefined"));
        const data = await UserConfig.get();

        // const child = spawn(path.join(Pathes.Game, "RimWorldWin64.exe"), [], {
        //     detached: true, // Від’єднує процес від Electron
        //     stdio: "ignore", // Не чекає вхідних/вихідних даних
        // });
        // child.unref(); // Дозволяє Electron закритися незалежно від процесу

        shell.openExternal("steam://launch/294100");
        if (data.closeWindowAfterRun) win.close();
    },


    async getGameInfo() {
        if (!Pathes.Game) return {
            success: false as const,
            message: Localize("error_gamePathIsUndefined"),
        }
        // const res = await UserConfig.GetWithValidate();
        // if (!res.success) return res;
        // const uc = res.data;

        if (!fs.existsSync(path.join(Pathes.Game, "Version.txt"))) {
            return {
                success: false as const,
            }
        }

        const gameVersionFull = fs.readFileSync(path.join(Pathes.Game, "Version.txt")).toString().trim() as FullVersion;
        const gameVersionShort = gameVersionFull.match(/^(\d+\.\d+)./)![1]! as ShortVersion;

        return {
            success: true as const,
            data: {
                gamePath: Pathes.Game,
                gameVersionFull, gameVersionShort,
            } satisfies GameInfoData
        };
    },


    //#region Localization
    setLocal: (e, newLang: string) => UserConfig.set("language", newLang),
    getTargetLocalJSON: () => Local.getTargetLocal(),
    getAccessLanguages: () => Local.getAccessLanguages(),
    //#endregion




    //#region ModPacks
    async saveModPack(e, packName: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        ModPacks.save(packName);
    },
    async useModPack(e, packName: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        ModPacks.use(packName);
    },
    async deleteModPack(e, packName: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        ModPacks.remove(packName);
    },
    async renameModPack(e, oldname: string, newname: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        ModPacks.rename(oldname, newname);
    },
    async getModPacksList() {
        return ModPacks.load();
    },
    //#endregion




    //#region Tags
    hasTag(e, name: string) {
        const tags = UserConfig.get("tags");
        return tags.some(a => a.name == name);
    },
    setTag(e, tag: ModTag) {
        const tags = UserConfig.get("tags");

        const targetTagInd = tags.findIndex(a => a.name == tag.name);
        if (targetTagInd >= 0) {
            tags.splice(targetTagInd, 1, tag);
        } else {
            tags.push(tag);
        }

        UserConfig.set("tags", tags);
    },
    renameTag(e, oldname: string, newname: string) {
        const tags = UserConfig.get("tags");

        const targetTag = tags.find(a => a.name == oldname);
        if (targetTag) {
            targetTag.name = newname;
            UserConfig.set("tags", tags);
        }
    },
    removeTag(e, name: string) {
        const tags = UserConfig.get("tags");

        const targetTagInd = tags.findIndex(a => a.name == name);
        if (targetTagInd >= 0) {
            tags.splice(targetTagInd, 1);
            UserConfig.set("tags", tags);
        }
    },
    //#endregion




    // DEV
    openDevTools(e) {
        win.webContents.openDevTools();
    }
} satisfies Record<string, (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any>









// type FindFunction<O> = { [K in keyof O]: O[K] extends (...args: any[]) => any ? K : never }[keyof O]; 
// const __DEBUG__: { [K in keyof typeof test]: typeof test[K] extends (...args: any[]) => any ? 0 : 1 } extends infer O ?  O[keyof O] extends 1? 1 : 0 : never
//     = 1;

declare global {
    namespace Electron {
        interface IpcRenderer {
            // on<K extends keyof Events>(channel: K, data: (e: Electron.IpcRendererEvent, ...data: Events[K]) => void): void
            invoke(channel: string, data: unknown): void
        }
    }
}


export function InitIPCEvents() {
    for (let name in IPCEvents) {
        ipcMain.handle(name, IPCEvents[name as keyof typeof IPCEvents]);
    }
}