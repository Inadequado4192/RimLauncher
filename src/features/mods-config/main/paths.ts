import { byPlatform } from "#features/base/main";
import { app } from "electron";
import path from "path";

export const PathToRimWorldUserDir = byPlatform({
    win32: () => path.join(app.getPath("appData"), "..", "LocalLow", `Ludeon Studios/RimWorld by Ludeon Studios`),
    darwin: () => path.join(app.getPath("home"), `Library/Application Support/RimWorld`),
    linux: () => path.join(app.getPath("home"), `.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios`),
});

export const PathToConfigDir = path.join(PathToRimWorldUserDir, "Config");
export const PathToModsConfigXMLFile = path.join(PathToConfigDir, "ModsConfig.xml");