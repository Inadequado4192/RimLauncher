import { ModTagCreate, ModTagPatch } from "./schemas";

export enum ModTagIpc {
    Create = "mod-tag:create",
    Patch = "mod-tag:patch",
    Delete = "mod-tag:delete",
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [ModTagIpc.Create]: (modTag: ModTagCreate) => void
        [ModTagIpc.Patch]: (uuid: string, patch: ModTagPatch) => void
        [ModTagIpc.Delete]: (uuid: string) => void
    }
}