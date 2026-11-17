import { useModList } from "#features/mod-core/renderer";
import { SteamMod, SteamModType } from "#features/steam/shared";
import { useShallow } from "zustand/shallow";

export function useSteamModsWidthSelector<T>(selector: (ms: SteamMod[]) => T): T {
    return useModList(useShallow((s) => selector((s.mods ?? []).filter(SteamModType.is))));
}

