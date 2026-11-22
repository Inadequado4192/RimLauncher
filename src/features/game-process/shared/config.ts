import { defineConfigField } from "#features/user-config/shared";
import z from "zod";

export const CloseAfterRunField = defineConfigField("closeWindowAfterRun", z.boolean(), false);