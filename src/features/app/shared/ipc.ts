import { LocalizedString } from "#features/localization/shared";
import { CheckForUpdatesResult } from "./types";

export enum AppIpc {
    GetInfo = "app:get-info",
    RunGame = "app:run-game",

    CheckForUpdates = "app:check-for-updates",
    QuitAndInstall = "app:quit-and-install",
    DownloadUpdate = "app:download-update",

    ProgressEvent = "app:progress-event",
}

export type ProgressEvent = { progressId: string } & (
    | { type: "progress"; percent: number | null; details?: LocalizedString }
    | { type: "done" }
    | { type: "error"; error: LocalizedString | string }
);

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [AppIpc.GetInfo]: () => { name: string; version: string };
        [AppIpc.RunGame]: () => void,

        [AppIpc.CheckForUpdates]: () => CheckForUpdatesResult | null,
        [AppIpc.QuitAndInstall]: () => void,
        [AppIpc.DownloadUpdate]: () => { progressId: string },
    }
    interface IpcEventMap {
        [AppIpc.ProgressEvent]: (event: ProgressEvent) => void
    }
}