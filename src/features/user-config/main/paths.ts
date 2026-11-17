import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";
import { byPlatform } from "#features/base/main";
import { app } from "electron";
import { existsSync } from "fs";
import fs from "fs/promises";
import { LocalKey } from "#features/localization/shared";
const run = promisify(execFile);


// Steam
const isSteamDir = (p: string) => existsSync(path.join(p, "steamapps"));
export async function FindSteamPath() {
    const home = app.getPath("home");
    const candidates = await byPlatform({
        async win32() {
            const out: string[] = [];
            for (const [key, value] of [
                ["HKCU\\Software\\Valve\\Steam", "SteamPath"],
                ["HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam", "InstallPath"],
            ] satisfies [string, string][]) {
                try {
                    const { stdout } = await run("reg", ["query", key, "/v", value]);
                    const m = stdout.match(/REG_SZ\s+(.+)/);
                    if (m) out.push(path.normalize(m[1]!.trim()));
                } catch { /* ключа немає */ }
            }
            out.push("C:\\Program Files (x86)\\Steam");
            return out;
        },
        linux: async () => [
            path.join(home, ".steam", "steam"),
            path.join(home, ".local", "share", "Steam"),
            path.join(home, ".var", "app", "com.valvesoftware.Steam", ".steam", "steam"),
        ],
        darwin: async () => [path.join(home, "Library", "Application Support", "Steam")],
    })


    for await (const candidate of candidates) {
        if (await isSteamDir(candidate)) return candidate;
    }
}
export function validateSteamDir(p: string): LocalKey | null {
    p = p.trim();
    if (!p) return "common.errors.pathEmpty";
    if (!existsSync(p)) return "common.errors.pathNotFound";
    if (!existsSync(path.join(p, "steamapps"))) return "mainWindow.settings.errors.notSteamDir";
    return null;
}







// Game
async function getLibraries(steamPath: string): Promise<string[]> {
    const libs = [steamPath];
    try {
        const vdf = await fs.readFile(path.join(steamPath, "steamapps", "libraryfolders.vdf"), "utf8");
        for (const m of vdf.matchAll(/"path"\s+"([^"]+)"/g)) {
            // у VDF зворотні слеші подвоєні: "D:\\SteamLibrary"
            libs.push(path.normalize(m[1]!.replace(/\\\\/g, "\\")));
        }
    } catch { }
    return [...new Set(libs)];
}

async function isRimWorldDir(dir: string) {
    const checks = await Promise.all(
        ["Mods", "Data"].map((n) => fs.access(path.join(dir, n)).then(() => true, () => false))
    );
    return checks.every(Boolean);
}
export function validateRimWorldDir(p: string): LocalKey | null {
    p = p.trim();
    if (!p) return "common.errors.pathEmpty";
    if (!existsSync(p)) return "common.errors.pathNotFound";
    if (
        !existsSync(path.join(p, "RimWorld.exe")) &&
        !existsSync(path.join(p, "RimWorldWin64.exe"))
    ) return "mainWindow.settings.errors.notGameDir";
    return null;
}


export async function FindGamePath(steamPath?: string): Promise<string | undefined> {
    const steam = steamPath ?? await FindSteamPath();
    if (!steam) return;

    for (const lib of await getLibraries(steam)) {
        const target = path.join(lib, "steamapps", "common", "RimWorld");
        if (await isRimWorldDir(target)) return target;
    }
}


export function getUserConfigPath() {
    return path.join(app.getPath("userData"), "config.json")
}
