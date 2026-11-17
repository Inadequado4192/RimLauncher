
import { ipc } from "#features/base/renderer";
import { create } from "zustand";
import { GameInfo, GameInfoIpc } from "../../shared";
import { subscribeWithSelector } from "zustand/middleware";

interface ModsConfigState {
    info: GameInfo | null;
}
export const useGameInfo = create<ModsConfigState>()(subscribeWithSelector((): ModsConfigState => ({ info: null })));

export async function initGameInfo() {
    const info = await ipc.invoke(GameInfoIpc.Read);
    useGameInfo.setState({ info });
}