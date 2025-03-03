import path from "path";
import fs from "fs";
import { app, dialog } from "electron";
import { execSync } from "child_process";
import UserConfig from "./Config";
import Localize from "@common/Localize";

type AccessPlatforms = Extract<typeof process.platform, "win32" | "linux" | "darwin">;
export function createPath<D extends Record<AccessPlatforms, () => (string | undefined)>>(data: D): ReturnType<D[AccessPlatforms]> {
    if (process.platform in data) {
        const val = data[process.platform as keyof typeof data]! as D[AccessPlatforms];
        return val() as ReturnType<D[AccessPlatforms]>;
    };

    throw Error(`Unknown Platform: ${process.platform}. Access: "win32" | "linux" | "darwin"`);
}

export namespace FindPathes {
    export function Steam() {
        return createPath({
            win32() {
                try {
                    const result = execSync("reg query \"HKCU\\Software\\Valve\\Steam\" /v SteamPath");
                    const match = result.toString().match(/SteamPath\s+REG_SZ\s+(.+)/);
                    if (!match) return;
                    const target = match[1]!.trim();
                    if (DebugPathes.isSteam(target).success) return target;
                } catch { }
            },
            linux() {
                const target = path.join(app.getPath("home"), ".var/app/com.valvesoftware.Steam/.steam/steam");
                if (DebugPathes.isSteam(target).success) return target;
            },
            darwin() {
                const target = path.join(app.getPath("home"), "Library", "Application Support", "Steam")
                if (DebugPathes.isSteam(target).success) return target;
            },
        });
    }
    export function RimWorldGamePath() {
        const steamPath = Steam();
        if (!steamPath) return;
        const target = path.join(steamPath, "steamapps", "common", "RimWorld");
        if (DebugPathes.isRimWorldGamePath(target).success) return target;
    }
}

export namespace DebugPathes {
    export function isSteam(_path: string) {
        try {
            if (!_path) return {
                success: false,
                message: "The path is undefined",
                fatal: false
            };

            if (!fs.existsSync(_path)) return {
                success: false,
                message: "The path does not exist",
                fatal: true
            };

            if (!fs.existsSync(path.join(_path, "steamapps"))) return {
                success: false,
                message: "This may be the wrong directory.",
                fatal: false
            };
            return { success: true };
        } catch (e) {
            return {
                success: false,
                message: JSON.stringify(e),
                fatal: true
            };
        }
    }
    export function isRimWorldGamePath(_path: string) {
        try {
            if (!_path) return {
                success: false,
                message: "The path is undefined",
                fatal: true
            };

            if (!fs.existsSync(_path)) return {
                success: false,
                message: "The path does not exist",
                fatal: true
            };

            if (!fs.existsSync(path.join(_path, "steam_appid.txt"))) return {
                success: false,
                message: "This may be the wrong directory",
                fatal: false
            };

            if (fs.readFileSync(path.join(_path, "steam_appid.txt")).toString() !== "294100") return {
                success: false,
                message: "This is not Rimworld",
                fatal: true
            };

            return {
                success: true
            }
        } catch (e) {
            return {
                success: false,
                message: JSON.stringify(e),
                fatal: true
            };
        }
    }
}

export const Pathes = {
    UserConfig: path.join(app.getPath("userData"), "config.json"),

    RimWorldUser: createPath({
        win32: () => path.join(app.getPath("home"), `AppData/LocalLow/Ludeon Studios/RimWorld by Ludeon Studios`),
        darwin: () => path.join(app.getPath("home"), `Library/Application Support/RimWorld`),
        linux: () => path.join(app.getPath("home"), `.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios`),
    }),
    get ModPacks() {
        return path.join(this.RimWorldUser, "ModPacks");
    },
    get Config() {
        return path.join(this.RimWorldUser, "Config");
    },
    get ModsConfigXML() {
        return path.join(this.Config, "ModsConfig.xml");
    },
    get Steam() {
        return UserConfig.Get("steamPath");
    },
    get Game() {
        return UserConfig.Get("gamePath");
    },
    get GameWorkshopFolder() {
        if (this.Steam) return path.join(this.Steam, "steamapps", "workshop", "content", "294100");
    }
}


export function EnsurePathExists() {
    if (!fs.existsSync(Pathes.ModsConfigXML)) {
        dialog.showErrorBox("Error", Localize("error_modsConfigXmlNotFound", [Pathes.ModsConfigXML]));
        app.quit();
    }
    if (!fs.existsSync(Pathes.Config)) fs.mkdirSync(Pathes.Config);
    if (!fs.existsSync(Pathes.UserConfig)) fs.writeFileSync(Pathes.UserConfig, "{}");
}