import { app } from "electron";
import path from "path";

function createPath(data: Record<Extract<typeof process.platform, "win32" | "linux" | "darwin">, string>) {
    if (process.platform in data) return data[process.platform as keyof typeof data]!;

    throw Error(`Unknown Platform: ${process.platform}. Access: "win32" | "linux" | "darwin"`);
}

namespace Pathes {
    export const RimWorldUser = createPath({
        darwin: path.join(app.getPath("home"), `Library/Application Support/RimWorld`),
        linux: path.join(app.getPath("home"), `.config/unity3d/Ludeon Studios/RimWorld by Ludeon Studios`),
        win32: path.join(app.getPath("home"), `AppData/LocalLow/Ludeon Studios/RimWorld by Ludeon Studios`),
    });
    export const ModPacks = path.join(RimWorldUser, "ModPacks");
    export const ModsConfigXML = path.join(RimWorldUser, "./Config/ModsConfig.xml");
}

export default Pathes;