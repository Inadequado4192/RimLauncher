import { PackageIdLower } from "#features/app/shared";
import { ModsConfig } from "./schemas";

export enum ModsConfigIpc {
    Read = "mods-config:read",
    DisableMods = "mods-config:disable-mods",
    EnableMods = "mods-config:enable-mods",
    SetMods = "mods-config:set-mods",
    EnableModAfter = "mods-config:enable-mod-after",
    EnableModBefore = "mods-config:enable-mod-before",
    ClearActives = "mods-config:clear-actives",
    
    Changed = "mods-config:changed",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [ModsConfigIpc.Read]: () => ModsConfig
        [ModsConfigIpc.DisableMods]: (packageIds: PackageIdLower[]) => void,
        [ModsConfigIpc.EnableMods]: (packageIds: PackageIdLower[]) => void,
        [ModsConfigIpc.SetMods]: (packageIds: PackageIdLower[]) => void,
        [ModsConfigIpc.EnableModAfter]: (packageIds: PackageIdLower, after: PackageIdLower) => void,
        [ModsConfigIpc.EnableModBefore]: (packageIds: PackageIdLower, before: PackageIdLower) => void,
        [ModsConfigIpc.ClearActives]: () => void,
    }
    interface IpcEventMap {
       [ModsConfigIpc.Changed]: (config: ModsConfig) => void
    }
}