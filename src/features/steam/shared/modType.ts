import { z } from "zod";
import { defineModType, ModEntry } from "#features/mod-type/shared";

export const SteamModType = defineModType("steam", z.object({
    steamId: z.string().nullable(),
}));


export type SteamMod = ModEntry<{
    steamId: string | null
}>