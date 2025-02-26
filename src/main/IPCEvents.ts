import { dialog, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import UserConfig from "./Config";
import { win } from ".";
import { buildModsConfig, getModsConfig, getModsConfigAsString, loadModPacks, mkdirIfDontExists, modPackExt, parser } from "./utilts";
import Pathes from "@common/Pathes";
import { execFile, execFileSync, spawn } from "child_process";
import Schemes from "@common/Schemes";
import Local from "./localization";
import { z } from "zod";


export const IPCEvents = {
    "winClose": () => win.close(),
    "winMinimize": () => win.minimize(),
    "winToggleMaximize": () => win.isMaximized() ? win.restore() : win.maximize(),

    getPathes: () => ({
        ...Pathes,
        userConfig: UserConfig.getConfigPath()
    }),

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



    "activeMod": async (e, packageId: PackageId) => {
        const modsConfig = await getModsConfig();
        modsConfig.activeMods.li.push(packageId); // ERROR
        fs.writeFileSync(Pathes.ModsConfigXML, buildModsConfig(modsConfig));
    },
    "disableMod": async (e, packageId: PackageId) => {
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

    "UserConfigValidate": async () => await UserConfig.Validate(),
    "getModList": async () => {
        const res = await UserConfig.GetWithValidate();
        if (!res.success) return res;
        const conf = res.data;

        const steamFolder = conf.pathes.steam;
        const gameFolder = conf.pathes.game;
        const gameWorkshopFolder = path.join(steamFolder, "steamapps/workshop/content/294100");


        const list: ModInfo[] = [], warnings: {
            dirpath: string,
            xml: any,
            xmlText: string,
            issues: z.ZodFormattedError<any>
        }[] = [];

        function Read(type: ModInfo["type"], folder: string) {
            for (const folderName of fs.readdirSync(folder)) {
                const dirPath = path.join(folder, folderName);
                if (!fs.lstatSync(dirPath).isDirectory()) continue;

                const xmlText = fs.readFileSync(path.join(dirPath, "About/About.xml")).toString();
                const xml = parser.parse(xmlText);
                const result = Schemes.XML.ModMetaData(dirPath).safeParse(xml);
                if (!result.success) {
                    warnings.push({
                        dirpath: dirPath, xml, xmlText,
                        issues: result.error.format()
                    });
                    continue;
                }

                const about = result.data.ModMetaData;
                if (about.name === undefined) about.name = folderName;

                const previewPath = (p => fs.existsSync(p) ? p : undefined)(path.join(dirPath, "About/Preview.png"));
                const steamId = type == "Steam"
                    ? (p => fs.existsSync(p) ? fs.readFileSync(p).toString() : undefined)(path.join(dirPath, "About/PublishedFileId.txt"))
                    : undefined;

                list.push({ type, dirPath, previewPath, about, steamId });
            }
        }

        if (fs.existsSync(gameWorkshopFolder)) Read("Steam", gameWorkshopFolder);
        Read("DLC", path.join(gameFolder, "Data"));
        Read("Local", path.join(gameFolder, "Mods"));

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
        const res = await UserConfig.GetWithValidate();
        if (!res.success) return res;

        const child = spawn(path.join(res.data.pathes.game, "RimWorldWin64.exe"), res.data.runArg?.split(/\s+/) ?? [], {
            detached: true, // Від’єднує процес від Electron
            stdio: "ignore", // Не чекає вхідних/вихідних даних
        });
        child.unref(); // Дозволяє Electron закритися незалежно від процесу

        if (res.data.closeWindowAfterRun) win.close();
    },


    async getGameInfo() {
        const res = await UserConfig.GetWithValidate();
        if (!res.success) return res;
        const uc = res.data;


        const gameVersionFull = fs.readFileSync(path.join(uc.pathes.game, "Version.txt")).toString().trim() as FullVersion;
        const gameVersionShort = gameVersionFull.match(/^(\d+\.\d+)./)![1]! as ShortVersion;

        return {
            success: true,
            data: {
                gamePath: uc.pathes.game,
                gameVersionFull, gameVersionShort,
            } satisfies GameInfo
        } as const;
    },


    setLocal: (e, newLang: string) => UserConfig.Set("language", newLang),
    getTargetLocalJSON: () => Local.getTargetLocal(),
    getAccessLanguages: () => Local.getAccessLanguages(),

} satisfies Record<string, (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any>



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