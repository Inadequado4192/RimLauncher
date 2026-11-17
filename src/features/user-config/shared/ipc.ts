import { LocalKey } from "#features/localization/shared";
import { RawConfig } from "./defineConfigField";

export type PathKey = "steamPath" | "gamePath";

export enum UserConfigIpc {
    Read = "user-config:read",
    SetField = "user-config:set-field",
    Changed = "user-config:changed",
    ValidatePaths = "user-config:validate-paths",
};

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [UserConfigIpc.Read]: () => RawConfig,
        [UserConfigIpc.SetField]: (key: string, value: unknown) => void,
        [UserConfigIpc.ValidatePaths]: () => Partial<Record<PathKey, LocalKey>>,
    }
    interface IpcEventMap {
        [UserConfigIpc.Changed]: (raw: RawConfig) => void,
    }
}