import path from "path";
import chokidar, { FSWatcher } from "chokidar";
import { win } from "..";
import UserConfigStore from "../store/UserConfigStore";
import { Pathes } from "main/Pathes";
import ModsConfig from "../store/ModsConfigStore";
import ModPacks from "../services/ModPacks";
import EventEmitter from "events";
import ModListActions from "main/services/modListActions";

export interface FileEvents {
    UserConfig_Changed: [config: UserConfig],
    ModsConfig_Changed: [xml: ModsConfig],
    ModPacks_Changed: [list: ModPackInfo[]],
    ModList_Changed: [method: "add", newContent: ModReadingResult] | [method: "remove", path: string]
}



// export interface MainProcessEvents {
//     GameWorkshopFolderPathChanged: [newpath: string]
// }


// const MainProcessEmitter = new EventEmitter<MainProcessEvents>();


export function InitWebEvents() {
    chokidar.watch(Pathes.File_UserConfig, { ignoreInitial: true }).on("all", (event, path) => {
        // add, change, unlink
        webEvents.UserConfig_Changed(UserConfigStore.get());
    });
    chokidar.watch(Pathes.File_ModsConfigXML, { ignoreInitial: true }).on("all", (event, path) => {
        webEvents.ModsConfig_Changed(ModsConfig.get());
    });
    chokidar.watch(Pathes.Dir_ModPacks, { ignoreInitial: true }).on("all", (event, path) => {
        webEvents.ModPacks_Changed(ModPacks.load());
    });

    {
        // let watcher: FSWatcher | null = null;

        function startWatchUpdates(targetPath: string) {
            // if (watcher) watcher.close();
            // watcher = 
            chokidar.watch(targetPath, { ignoreInitial: true, depth: 0 })
                .on("addDir", (newDirPath) => {
                    if (path.basename(newDirPath).startsWith("~")) return;
                    setTimeout(async () => {
                        const v = await ModListActions.getModFrom(newDirPath);
                        webEvents.ModList_Changed("add", v);
                    }, 1000);
                })
                .on("unlinkDir", (newDirPath) => {
                    if (path.basename(newDirPath).startsWith("~")) return;
                    webEvents.ModList_Changed("remove", newDirPath);
                });

            // return startWatchUpdates;
        }

        if (Pathes.Dir_GameWorkshop) startWatchUpdates(Pathes.Dir_GameWorkshop);
        startWatchUpdates(Pathes.Dir_LocalMods);

        // MainProcessEmitter.on("GameWorkshopFolderPathChanged", startWatchUpdates);
    }
}


export const webEvents = new Proxy({}, {
    get: (target: {}, channel: string) => (...data: any) => win.webContents.send(channel, ...data)
}) as { [C in keyof FileEvents]: (...p: FileEvents[C]) => void }