import { defineModType, ModEntry } from "#features/mod-type/shared";
import z from "zod";
import { gitInfoReadSchema } from "./schemas";
import { LocalKey } from "#features/localization/shared";


const localKeySchema = z.string().transform(s => s as LocalKey);
const localizedStringSchema = z.object({
    key: localKeySchema,
    args: z.array(z.string()).optional() 
})//.or(localKeysSchema);

export const okOrError = <T extends z.ZodType>(schema: T) =>
    z.union([
        z.object({ ok: z.literal(true), data: schema }),
        z.object({ ok: z.literal(false), error: localizedStringSchema }),
    ]);

const GitModData = z.object({ gitInfo: okOrError(gitInfoReadSchema) });


export const GitModType = defineModType("git", GitModData);
export type GitModData = z.output<typeof GitModData>;

export type GitMod = ModEntry<GitModData>;



