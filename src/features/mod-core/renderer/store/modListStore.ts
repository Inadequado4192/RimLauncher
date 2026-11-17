import { ModEntry } from "#features/mod-type/shared";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface ModListState {
    mods: ModEntry[] | undefined
}

export const useModList = create<ModListState>()(subscribeWithSelector((_set) => ({
    mods: []
})));