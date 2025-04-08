import chokidar, { FSWatcher } from "chokidar";
import { win } from "..";
import UserConfig from "../Config";
import { Pathes } from "src/main/Pathes";
import ModsConfig from "../tools/ModsConfig";
import ModPacks from "../tools/ModPacks";
import EventEmitter from "events";
import ModList from "@Tools/ModList";

export interface FileEvents {
    changeUseConfig: [config: UserConfig],
    changeModsConfigFile: [xml: ModsConfig_Schema],
    changeModPacksList: [list: ModPackInfo[]],

    WorkshopContentChanged: [method: "add", newContent: ModInfo] | [method: "remove", path: string]
}



export interface MainProcessEvents {
    GameWorkshopFolderPathChanged: [newpath: string]
}


const MainProcessEmitter = new EventEmitter<MainProcessEvents>();


export function InitWebEvents() {
    chokidar.watch(Pathes.UserConfig, { ignoreInitial: true }).on("all", (event, path) => {
        webEvents.changeUseConfig(UserConfig.get());
    });
    chokidar.watch(Pathes.ModsConfigXML, { ignoreInitial: true }).on("all", (event, path) => {
        webEvents.changeModsConfigFile(ModsConfig.get());
    });
    chokidar.watch(Pathes.ModPacks, { ignoreInitial: true }).on("all", (event, path) => {
        webEvents.changeModPacksList(ModPacks.load());
    });

    {
        let watcher: FSWatcher | null = null;

        function start(newpath: string) {
            if (watcher) watcher.close();
            watcher = chokidar.watch(newpath, { ignoreInitial: true, depth: 0 })
                .on("addDir", (path) => {
                    let v = ModList.getModFrom("Steam", path);
                    v && webEvents.WorkshopContentChanged("add", v);
                })
                .on("unlinkDir", (path) => {
                    webEvents.WorkshopContentChanged("remove", path);
                });
                
            return start;
        }

        if (Pathes.GameWorkshopFolder) start(Pathes.GameWorkshopFolder);

        MainProcessEmitter.on("GameWorkshopFolderPathChanged", start);
    }
}


export const webEvents = new Proxy({}, {
    get: (target: {}, channel: string) => (...data: any) => win.webContents.send(channel, ...data)
}) as { [C in keyof FileEvents]: (...p: FileEvents[C]) => void }
