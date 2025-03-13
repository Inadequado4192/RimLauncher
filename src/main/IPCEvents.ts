import { dialog, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import UserConfig from "./Config";
import { win } from ".";
import { buildModsConfig, getModsConfig, getModsConfigAsString, loadModPacks, mkdirIfDontExists, modPackExt, parser } from "./utilts";
import { Pathes } from "src/main/Pathes";
import { execFile, execFileSync, spawn } from "child_process";
import Schemes from "@common/Schemes";
import Local from "./localization";
import { z } from "zod";
import Localize from "@common/Localize";


export const IPCEvents = {
    "winClose": () => win.close(),
    "winMinimize": () => win.minimize(),
    "winToggleMaximize": () => win.isMaximized() ? win.restore() : win.maximize(),

    getPathes: () => ({ ...Pathes }),

    "openConfigFile": async () => {
        await shell.openPath(UserConfig.getConfigPath());
    },


    "selectFile": (e, setting: { type: "folder" | "file" }) => {
        return dialog.showOpenDialog({
            properties: [
                setting.type == "folder" ? "openDirectory" : "openFile",
                "dontAddToRecent"
            ]
        });
    },
    "openPath": async (e, path: string) => {
        await shell.openPath(path); ``
    },



    activeMod: async (e, packageId: PackageId) => {
        const modsConfig = await getModsConfig();
        modsConfig.activeMods.li.push(packageId); // ERROR
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(modsConfig));
    },
    activeModBefore: async (e, targetId: PackageId, beforeId: PackageId) => {
        const modsConfig = await getModsConfig();

        if (targetId == beforeId) return;

        const targetIndex = modsConfig.activeMods.li.indexOf(targetId);
        const beforeIndex = modsConfig.activeMods.li.indexOf(beforeId);

        if (beforeIndex === -1) {
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
            return;
        }
        if (targetIndex < beforeIndex) {
            modsConfig.activeMods.li.splice(beforeIndex, 0, targetId);
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
        } else {
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
            modsConfig.activeMods.li.splice(beforeIndex, 0, targetId);
        }
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(modsConfig));
    },
    activeModAfter: async (e, targetId: PackageId, afterId: PackageId) => {
        const modsConfig = await getModsConfig();

        if (targetId == afterId) return;

        const targetIndex = modsConfig.activeMods.li.indexOf(targetId);
        const afterIndex = modsConfig.activeMods.li.indexOf(afterId);

        if (afterIndex === -1) {
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
            return;
        }

        if (targetIndex < afterIndex) {
            modsConfig.activeMods.li.splice(afterIndex + 1, 0, targetId);
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
        } else {
            if (targetIndex !== -1) modsConfig.activeMods.li.splice(targetIndex, 1);
            modsConfig.activeMods.li.splice(afterIndex + 1, 0, targetId);
        }
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(modsConfig));
    },
    disableMod: async (e, packageId: PackageId) => {
        const modsConfig = await getModsConfig();
        modsConfig.activeMods.li = modsConfig.activeMods.li.filter(a => a !== packageId);
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(modsConfig));
    },

    getModsConfig: async () => await getModsConfig(),
    setActiveMods: async (e, list: PackageId[]) => {
        const conf = getModsConfig();
        conf.activeMods.li = list;
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(conf));
    },
    async clearModsConfig() {
        const conf = getModsConfig();
        conf.activeMods.li = ["ludeon.rimworld" as PackageId];
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(conf));
    },




    getUserConfig: () => UserConfig.Get(),
    getUserConfigByKey: <K extends keyof UserConfig>(e: any, key: K) => UserConfig.Get(key),
    setUserConfig: (e, data: UserConfig) => UserConfig.Set(data),
    setUserConfigByKey: <K extends keyof UserConfig>(e: any, key: K, data: UserConfig[K]) => UserConfig.Set(key, data),

    UserConfigDebug: async () => await UserConfig.Debug(),
    getModList: async () => {
        // const res = await UserConfig.GetWithValidate();
        // if (!res.success) return res;

        const list: ModInfo[] = [], warnings: {
            dirPath: string,
            message: string,
            // xml: any,
            // xmlText: string,
            // issues: z.ZodFormattedError<any>
        }[] = [];

        function Read(type: ModInfo["type"], folderPath: string) {
            if (!fs.existsSync(folderPath)) return;
            for (const folderName of fs.readdirSync(folderPath)) {
                const dirPath = path.join(folderPath, folderName);
                if (!fs.lstatSync(dirPath).isDirectory()) continue;


                
                const aboutDirPath = (ps => ps.find(p => fs.existsSync(p)))([
                    path.join(dirPath, "About"),
                    path.join(dirPath, "about"),
                ]);
                
                if (!aboutDirPath) {
                    warnings.push({
                        dirPath, message: `${path.join(dirPath, "About")} is not found`
                    });
                    continue;
                }

                const aboutXmlPath = (ps => ps.find(p => fs.existsSync(p)))([
                    path.join(aboutDirPath, "About.xml"),
                    path.join(aboutDirPath, "about.xml"),
                ]);

                if (!aboutXmlPath) {
                    warnings.push({
                        dirPath, message: `${path.join(dirPath, "About/About.xml")} is not found`
                    });
                    continue;
                }

                const xmlText = fs.readFileSync(aboutXmlPath).toString();
                const xml = parser.parse(xmlText);
                const result = Schemes.XML.ModMetaData(dirPath).safeParse(xml);
                if (!result.success) {
                    warnings.push({
                        dirPath,
                        message: result.error.formErrors.formErrors.join("\n"),
                    });
                    continue;
                }

                const about = result.data.ModMetaData;
                if (about.name === undefined) about.name = folderName;

                const previewPath = (ps => ps.find(p => fs.existsSync(p)))([
                    path.join(aboutDirPath, "Preview.png"),
                    path.join(aboutDirPath, "preview.png"),
                ]);
                const steamId = type == "Steam"
                    ? (p => fs.existsSync(p) ? fs.readFileSync(p).toString() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt"))
                    : undefined;

                list.push({ type, dirPath, previewPath, about, steamId });
            }
        }


        if (Pathes.GameWorkshopFolder) Read("Steam", Pathes.GameWorkshopFolder);
        if (!Pathes.Game) return {
            success: false as const,
            message: Localize("error_gamePathIsUndefined"),
        }
        Read("DLC", path.join(Pathes.Game, "Data"));
        Read("Local", path.join(Pathes.Game, "Mods"));

        return {
            success: true as const,
            data: list,
            warnings
        };
    },



    //#region ModPacks
    async saveModPack(e, name: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        fs.writeFileSync(path.join(Pathes.ModPacks, `${name}${modPackExt}`), getModsConfigAsString());
    },
    async loadModPack(e, name: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        fs.writeFileSync(Pathes.ModsConfigXML, fs.readFileSync(path.join(Pathes.ModPacks, `${name}${modPackExt}`)).toString());
    },
    async deleteModPack(e, name: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        fs.rmSync(path.join(Pathes.ModPacks, `${name}${modPackExt}`));
    },
    async renameModPack(e, oldname: string, newname: string) {
        mkdirIfDontExists(Pathes.ModPacks);
        fs.renameSync(path.join(Pathes.ModPacks, `${oldname}${modPackExt}`), path.join(Pathes.ModPacks, `${newname}${modPackExt}`));
    },
    async getModPacksList() {
        return loadModPacks();
    },
    //#endregion

    async runGame() {
        // if (!Pathes.Game) return dialog.showErrorBox("Error", Localize("error_gamePathIsUndefined"));
        const data = await UserConfig.Get();

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
            } satisfies GameInfo
        };
    },


    setLocal: (e, newLang: string) => UserConfig.Set("language", newLang),
    getTargetLocalJSON: () => Local.getTargetLocal(),
    getAccessLanguages: () => Local.getAccessLanguages(),

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