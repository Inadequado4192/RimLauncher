import { InspectedArchive } from "#features/archive/shared";
import { LocalizedString } from "#features/localization/shared";
import { GitMod } from "./modType";
import { GitInfo } from "./schemas";


export enum GitIpc {
    InstallStart = "git:install-start",
    InstallConfirm = "git:install-confirm",
    // InstallCancel = "git:install-cancel",
    InstallEvent = "git:install-event",

    CheckUpdates = "git:check-updates",
    OpenModConfig = "git:open-mod-config",
    DeleteMod = "git:delete-mod",
}

export type InstallEvent = { installId: string } & (
    | { type: "progress"; stage: "download" | "unzip" | "move" | "cleanup"; percent: number | null; details?: string }
    | { type: "inspected"; archive: InspectedArchive }
    | { type: "done" }
    | { type: "error"; error: LocalizedString | string }
);

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [GitIpc.InstallStart]: (source: { url: string } | { mod: GitMod }) => { installId: string }
        [GitIpc.InstallConfirm]: (downloadId: string, opts: { excludeFiles: string[], rootDirectory: string }) => void
        // [GitIpc.InstallCancel]: (installId: string) => void

        [GitIpc.CheckUpdates]: (mods: GitInfo[]) => { hasUpdateSha: string[] }
        [GitIpc.OpenModConfig]: (mod: GitMod) => void
        [GitIpc.DeleteMod]: (mod: GitMod) => void
    }
    interface IpcEventMap {
        [GitIpc.InstallEvent]: (event: InstallEvent) => void
    }
}
