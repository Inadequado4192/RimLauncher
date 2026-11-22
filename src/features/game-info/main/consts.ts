import { byPlatform } from "#features/base/main";

export const GameExeNames = byPlatform({
    win32: () => ["RimWorld.exe", "RimWorldWin64.exe", "RimWorldWin.exe"],
    linux: () => ["RimWorld", "RimWorldLinux"],
    darwin: () => ["RimWorld.app", "RimWorldMac.app"],
});

export const GameProcessNames = byPlatform({
    win32: () => ["RimWorld.exe", "RimWorldWin64.exe", "RimWorldWin.exe"],
    linux: () => ["RimWorld", "RimWorldLinux"],
    darwin: () => ["RimWorld by Ludeon Studios", "RimWorld", "RimWorldMac"],
});
