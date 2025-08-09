import path from "path";
import fs from "fs";
import { app, dialog } from "electron";
import { execSync } from "child_process";
import UserConfigStore from "./store/UserConfigStore";
import Localize from "@Common/Localize";

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
                    if (DebugPathesSpace.isSteam(target).success) return target;
                } catch { }
            },
            linux() {
                const posiblePathes = [
                    path.join(app.getPath("home"), ".steam / steam"),
                    path.join(app.getPath("home"), ".var/app/com.valvesoftware.Steam/.steam/steam"),
                ];
                for (const target of posiblePathes)
                    if (DebugPathesSpace.isSteam(target).success) return target;
            },
            darwin() {
                const posiblePathes = [
                    path.join(app.getPath("home"), "Library", "Application Support", "Steam"),
                ];
                for (const target of posiblePathes)
                    if (DebugPathesSpace.isSteam(target).success) return target;
            },
        });
    }
    export function RimWorldGamePath() {
        const steamPath = UserConfigStore.get("steamPath");
        if (!steamPath) return;

        const target = path.join(steamPath, "steamapps", "common", "RimWorld");
        if (DebugPathesSpace.isRimWorldGamePath(target).success) return target;
    }
}

export namespace DebugPathesSpace {
    export function isSteam(_path: string): ReturnedData {
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
                message: e instanceof Error ? e.message : String(e),
                fatal: true
            };
        }
    }
    export function isRimWorldGamePath(_path: string): ReturnedData {
        try {
            _path = _path.trim()
            if (_path === "") return {
                success: false,
                message: "The path is empty",
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
                message: e instanceof Error ? e.message : String(e),
                fatal: true
            };
        }
    }
}



export const Pathes = {
    get File_UserConfig() {
        return path.join(app.getPath("userData"), "config.json")
    },

    Dir_RimWorldUser: createPath({
        win32: () => path.join(app.getPath("home"), `AppData/LocalLow/Ludeon Studios/RimWorld by Ludeon Studios`),
        darwin: () => path.join(app.getPath("home"), `Library/Application Support/RimWorld`),
        linux: () => path.join(app.getPath("home"), `.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios`),
    }) as `AppData/LocalLow/Ludeon Studios/RimWorld by Ludeon Studios`,
    get Dir_ModPacks() {
        return path.join(this.Dir_RimWorldUser, "ModPacks");
    },
    get Dir_Config() {
        return path.join(this.Dir_RimWorldUser, "Config") as `${typeof this.Dir_RimWorldUser}/Config`;
    },
    get File_ModsConfigXML() {
        return path.join(this.Dir_Config, "ModsConfig.xml") as `${typeof this.Dir_Config}/ModsConfig.xml`;
    },
    get Dir_Steam() {
        return UserConfigStore.get("steamPath");
    },
    get Dir_Game() {
        return UserConfigStore.get("gamePath");
    },
    get Dir_LocalMods() {
        if (!this.Dir_Game) return null;
        return path.join(this.Dir_Game, "Mods") as `${typeof this.Dir_Game}/Mods`;
    },

    get Dir_GameWorkshop() {
        if (this.Dir_Steam) {
            const target = path.join(this.Dir_Steam, "steamapps", "workshop", "content", "294100");
            if (fs.existsSync(target)) return target;
        }
        if (this.Dir_Game) {
            const target = path.join(this.Dir_Game, "../../", "workshop", "content", "294100");
            if (fs.existsSync(target)) return target;
        }
    }
}
export const PathesMaker = {
    // gitname: () => `Git-${Date.now().toString()}` as const,
    gitinfo: "gitinfo.json" as const,
}

export const AppPathes = {
    icon: "/icon.png"
}