import { ModEntry } from "#features/mod-type/shared";

export enum ModCoreIpc {
    LoadAll = "mod-core:load-all",
    StopWatching = "mod-core:stop-watching",
    OnModAdded = "mod-core:mod-added",
    OnModRemoved = "mod-core:mod-removed",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [ModCoreIpc.LoadAll]: () => {
            list: ModEntry[];
            // errors: LocalizedString[];
        }
        [ModCoreIpc.StopWatching]: () => void
    }
    interface IpcEventMap {
        [ModCoreIpc.OnModAdded]: (data: ModEntry) => void,
        [ModCoreIpc.OnModRemoved]: (deletedDirPath: string) => void,
    }
}
export { };