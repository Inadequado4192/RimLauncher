import { Result } from "#features/base/shared";
import { FullVersion, ShortVersion } from "#features/app/shared";
import { LocalizedString } from "#features/localization/shared";

export enum GameInfoIpc {
    Read = "game-info:read"
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [GameInfoIpc.Read]: () => Result<GameInfo, LocalizedString>
    }
}

export interface GameInfo {
    gameVersionShort: ShortVersion,
    gameVersionFull: FullVersion,
    gamePath: string,
}