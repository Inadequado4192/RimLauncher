import { defineConfigField } from "#features/user-config/shared";
import z from "zod";

export const LanguageField = defineConfigField("language", z.string(), "en");