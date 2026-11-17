import { PackageId } from "#features/base/shared";
import { XMLList } from "#features/XML/shared";
import { z } from "zod";

export const modsConfigBaseReadSchema = z.object({
    version: z.string(),
    activeMods: XMLList(PackageId),
    knownExpansions: XMLList(PackageId)
});
export const modsConfigBaseWriteSchema = z.object({
    version: z.coerce.string(),
    activeMods: z.array(PackageId),
    knownExpansions: z.array(PackageId),
});

export const modsConfigReadSchema = z.union([
    z.object({ ModsConfigData: modsConfigBaseReadSchema }),
    z.object({ modsConfigData: modsConfigBaseReadSchema }),
    modsConfigBaseReadSchema,
]).transform(res => {
    if ("ModsConfigData" in res) return res.ModsConfigData;
    if ("modsConfigData" in res) return res.modsConfigData;
    return res;
});

// export const modsConfigWriteSchema = modsConfigBaseWriteSchema.transform(o => ({
//     ModsConfigData: {
//         version: o.version,
//         activeMods: { li: o.activeMods },
//         knownExpansions: { li: o.knownExpansions },
//     },
// }));


export const modsConfigPatchSchema = modsConfigBaseWriteSchema
    .omit({ knownExpansions: true, version: true })
    .partial();


export type ModsConfig = z.output<typeof modsConfigReadSchema>;
export type ModsConfigInput = z.input<typeof modsConfigReadSchema>;
export type ModsConfigPatch = z.output<typeof modsConfigPatchSchema>;