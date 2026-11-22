export enum GameProcessIpc {
    GetState = "game-process:get-state",
    Launch = "game-process:launch",
    Stop = "game-process:stop",
    OnStateChange = "game-process:on-state-change",
}

export interface GameState {
    running: boolean;
    pid: number | null;
}

declare module "#features/base/shared" {
    interface IpcInvokeMap {
        [GameProcessIpc.GetState]: () => GameState;
        [GameProcessIpc.Launch]: () => void;
        [GameProcessIpc.Stop]: () => void;
    }
    interface IpcEventMap {
        [GameProcessIpc.OnStateChange]: (state: GameState) => void;
    }
}