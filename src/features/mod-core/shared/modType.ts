import { z } from "zod";
import { defineModType } from "#features/mod-type/shared";

export const OfficialModType = defineModType("official", z.object({}));

export const LocalModType = defineModType("local", z.object({}));