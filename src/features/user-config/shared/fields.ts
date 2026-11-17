import z from "zod";
import { defineConfigField } from "./defineConfigField";

export const SteamPathField = defineConfigField("steamPath", z.string().nullable(), null);
export const GamePathField = defineConfigField("gamePath", z.string().nullable(), null);
export const CloseAfterRunField = defineConfigField("closeWindowAfterRun", z.boolean(), false);