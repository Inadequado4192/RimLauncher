import { app } from "electron";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

function createPath(data: Record<Extract<typeof process.platform, "win32" | "linux" | "darwin">, string | (() => string)>) {
    if (process.platform in data) {
        const val = data[process.platform as keyof typeof data]!;
        return typeof val === "function" ? val() : val;
    };

    throw Error(`Unknown Platform: ${process.platform}. Access: "win32" | "linux" | "darwin"`);
}

namespace Pathes {
    export const RimWorldUser = createPath({
        win32: path.join(app.getPath("home"), `AppData/LocalLow/Ludeon Studios/RimWorld by Ludeon Studios`),
        darwin: path.join(app.getPath("home"), `Library/Application Support/RimWorld`),
        linux: path.join(app.getPath("home"), `.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios`),
    });
    export const ModPacks = path.join(RimWorldUser, "ModPacks");
    export const Config = path.join(RimWorldUser, "Config");
    export const ModsConfigXML = path.join(Config, "ModsConfig.xml");

    if (!fs.existsSync(Config)) fs.mkdirSync(Config);




    export const Steam = createPath({
        win32() {
            try {
                const result = execSync("reg query \"HKCU\\Software\\Valve\\Steam\" /v SteamPath");
                const match = result.toString().match(/SteamPath\s+REG_SZ\s+(.+)/);
                if (match) return match[1]!.trim();
                throw 0;
            } catch { throw new Error("Steam path not found in registry"); }
        },
        darwin: path.join(app.getPath("home"), "Library", "Application Support", "Steam"),
        // linux: path.join(app.getPath("home"), ".steam", "steam"),
        linux: path.join(app.getPath("home"), ".var/app/com.valvesoftware.Steam/.steam/steam"),
    });
    export const Game = path.join(Steam, "steamapps", "common", "RimWorld");
    export const GameWorkshopFolder = path.join(Steam, "steamapps", "workshop", "content", "294100");
}


export default Pathes;