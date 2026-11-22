// features/game-process/renderer/index.ts
import { useEffect } from "react";
import { create } from "zustand";
import { ipc } from "#features/base/renderer";
import { GameProcessIpc, GameState } from "../shared";

const useGame = create<GameState | undefined>()(() => undefined);

export function useGameRunning() {
    useEffect(() => {
        void ipc.invoke(GameProcessIpc.GetState).then((s) => useGame.setState(s));
        return ipc.on(GameProcessIpc.OnStateChange, (s) => useGame.setState(s));
    }, []);

    return useGame((s) => s);
}

export const launchGame = () => ipc.invoke(GameProcessIpc.Launch);
export const stopGame = () => ipc.invoke(GameProcessIpc.Stop);