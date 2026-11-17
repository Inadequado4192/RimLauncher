import { defineConfigField } from "#features/user-config/shared";
import z from "zod";
import { modTagReadSchema } from "./schemas";

export const ModTagsConfigField = defineConfigField("tags", z.array(modTagReadSchema), []);
