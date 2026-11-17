import { PublishedFileOk } from "./api-example";

export enum SteamIpc {
    GetDitails = "steam:get-details",
    GetChangeLog = "steam:change-log",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [SteamIpc.GetDitails]: (steamIds: string[]) => PublishedFileOk[],
        [SteamIpc.GetChangeLog]: (workshopId: string) => string,
    }
}