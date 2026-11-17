import { defineConfigField } from "#features/user-config/shared";
import z from "zod";

export const SteamModsLastCheckedConfigField = defineConfigField("steamModsLastCheckedAt", z.number(), 0);
