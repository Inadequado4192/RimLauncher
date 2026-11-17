import { ModEntry } from "#features/mod-type/shared";
import { create } from "zustand";

interface ModListViewState {
    searchD: string;
    searchE: string;
    splitSearch: boolean;

    selectedMods: Set<ModEntry>,


    cursor: ModEntry | null;
    selectMods(mods: ModEntry[]): void;

    showModIcon: boolean;
    filterByTags: Set<string>;

    setSearchD(v: string): void;
    setSearchE(v: string): void;
    setBoth(v: string): void;
    toggleSplitSearch(): void;

    toggleModIcon(): void;

    toggleTagFilter(id: string): void;
    clearTagFilter(): void;
}

export const useModListView = create<ModListViewState>()((set) => ({
    searchD: "",
    searchE: "",
    splitSearch: false,
    showModIcon: false,
    filterByTags: new Set(),
    selectedMods: new Set(),
    cursor: null,


    setSearchD: (v) => set({ searchD: v }),
    setSearchE: (v) => set({ searchE: v }),
    setBoth: (v) => set({ searchD: v, searchE: v }),
    toggleSplitSearch: () => set((s) => ({ splitSearch: !s.splitSearch })),

    toggleModIcon: () => set((s) => ({ showModIcon: !s.showModIcon })),

    toggleTagFilter: (id) => set((s) => {
        const next = new Set(s.filterByTags);
        next.has(id) ? next.delete(id) : next.add(id);
        return { filterByTags: next };
    }),
    clearTagFilter: () => set({ filterByTags: new Set() }),

    selectMods: (mods) => set({
        selectedMods: new Set(mods),
        cursor: mods.at(-1) ?? null,
    }),
}));