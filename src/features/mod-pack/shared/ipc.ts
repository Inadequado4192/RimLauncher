import { PathError, Result } from "#features/base/shared";
import { LocalizedString } from "#features/localization/shared";
import { ModPack } from "./schemas";
import { ModPackEntry } from "./type";

export enum ModPackIpc {
    ReadAll = "mod-pack:read-all",
    Add = "mod-pack:add",
    Update = "mod-pack:update",
    Delete = "mod-pack:delete",
    Rename = "mod-pack:rename",
    Use = "mod-pack:use",
    OpenFolder = "mod-pack:open-folder"
};

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [ModPackIpc.ReadAll]: () => Result<ModPackEntry, PathError>[],
        [ModPackIpc.Add]: (modpack: ModPack) => Result<void, LocalizedString>
        [ModPackIpc.Update]: (modPackFileName: string, modpack: ModPack) => Result<void, LocalizedString>
        [ModPackIpc.Delete]: (modPackFileName: string) => void
        [ModPackIpc.Rename]: (modPackFileName: string, newName: string) => void
        [ModPackIpc.Use]: (modPack: ModPack) => void
        [ModPackIpc.OpenFolder]: () => void
    }
}