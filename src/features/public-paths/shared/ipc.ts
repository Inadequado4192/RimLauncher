import { PublicPath } from "./types";

export enum PublicPathsIpc {
    Get = "public-paths:get"
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [PublicPathsIpc.Get]: () => PublicPath[]
    }
}
export {};