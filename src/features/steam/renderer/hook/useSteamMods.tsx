import { useModList } from "#features/mod-core/renderer";
import { SteamMod, SteamModType } from "#features/steam/shared";
import { useShallow } from "zustand/shallow";

export function useSteamMods(): SteamMod[] {
    return useModList(useShallow((s) => (s.mods ?? []).filter(SteamModType.is)));
}