import fs from "fs";
import { win } from ".";
import UserConfig from "./Config";
import { getModsConfig, loadModPacks, mkdirIfDontExists } from "./utilts";
import Pathes from "src/main/Pathes";

export interface Events {
    changeConfig: [config: UserConfig],
    changeModsConfigFile: [xml: Awaited<ReturnType<typeof getModsConfig>>],
    "changeFile:ModPacks": [list: ModPackInfo[]],
}


export function sendEvent<K extends keyof Events>(channel: K, ...data: Events[K]) {
    win.webContents.send(channel, ...data);
}


export function InitEvents() {
    fs.watch(UserConfig.getConfigPath(), (event, filename) => {
        if (event != "change") return;
        const d = UserConfig.Get();
        sendEvent("changeConfig", d);
    });

    fs.watch(Pathes.ModsConfigXML, async (event, filename) => {
        if (event != "change") return;
        sendEvent("changeModsConfigFile", await getModsConfig())
    });

    mkdirIfDontExists(Pathes.ModPacks);
    fs.watch(Pathes.ModPacks, async (event, filename) => {
        if (event != "change") return;
        sendEvent("changeFile:ModPacks", loadModPacks())
    });
}