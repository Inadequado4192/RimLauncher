import path from "path";
import { z } from "zod";
import { app } from "electron";
import { DebugPathesSpace, FindPathes } from "./Pathes";


namespace Schemes {
    const AnyToEmptyOnject = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(any => typeof any === "object" && any !== null && !Array.isArray(any) ? any : {}, schema)


    const PackageId = z.coerce.string()
        .min(1, "Package ID is required.")
        .max(60, "Package ID must be 60 characters or less.")
        .regex(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/, "Package ID must contain only alphanumeric characters and dots, with at least one dot, and no repeated, leading, or trailing dots.")
        // .refine(id => !id.includes("Ludeon"), "Package ID cannot contain the word 'Ludeon'.")
        .transform(id => id.toLowerCase() as PackageId);


    export const ModTag = z.object({
        name: z.string(),
        color: z.string(),
        packageIds: z.array(PackageId)
    });


    // type UserStoreGet = z.infer<typeof UserStoreGet>;


    export namespace UserStore {
        export type Type = z.output<typeof Read>;

        export const Read = AnyToEmptyOnject(z.object({
            steamPath: z.string().nullable().catch(() => FindPathes.Steam() ?? null),
            gamePath: z.string().nullable().catch(() => FindPathes.RimWorldGamePath() ?? null),
            closeWindowAfterRun: z.boolean().catch(false),
            language: z.string().catch(() => app.getSystemLocale()),
            tags: z.array(ModTag).catch([]),
            lastCheckModUpdates: z.iso.datetime().catch(new Date().toISOString())
        }));

        export const Write = z.object({
            steamPath: z.string().nullable(),
            gamePath: z.string().nullable(),
            closeWindowAfterRun: z.boolean(),
            language: z.string(),
            tags: z.array(ModTag),
            lastCheckModUpdates: z.iso.datetime()
        });
        
        export const DebugPathes = z.object({
            steamPath: z.string().superRefine((_path, ctx) => {
                const result = DebugPathesSpace.isSteam(_path);
                if (!result.success) ctx.addIssue({ code: "custom", ...result });
            }),
            gamePath: z.string().superRefine((_path, ctx) => {
                const result = DebugPathesSpace.isRimWorldGamePath(_path);
                if (!result.success) ctx.addIssue({ code: "custom", ...result });
            }),
        });
    }







    export namespace XML {
        function XMLList<T extends z.ZodType>(t: T) {
            return z.union([
                z.literal("").transform(() => [] as never),
                z.object({ li: z.array(t) }).transform(l => l.li),
            ]).catch([]);
        }

        export namespace ModsConfig {
            export type Type = z.output<typeof Read>;
            // type xml = z.input<typeof Read extends z.ZodEffects<infer S, any, any> ? S : never>;

            export const Read = AnyToEmptyOnject(z.object({
                version: z.string().catch("0.0.0000 unknown"),
                activeMods: XMLList(PackageId).catch([]),
                knownExpansions: XMLList(PackageId).catch([]),
            }));

            export const Write = z.object({
                version: z.coerce.string(),
                activeMods: z.array(PackageId),
                knownExpansions: z.array(PackageId),
            }).transform(o => ({
                ModsConfigData: {
                    version: o.version,
                    activeMods: { li: o.activeMods },
                    knownExpansions: { li: o.knownExpansions },
                }
            }))
        }

        export const ModsPack = z.object({
            version: z.coerce.string(),
            activeMods: XMLList(PackageId),
            knownExpansions: XMLList(PackageId),
        });


        export const ModDependency = z.object({
            displayName: z.coerce.string(),
            packageId: PackageId,
            steamWorkshopUrl: z.coerce.string(),
        })


        export const ModMetaData = (dirpath: string) => z.object({
            name: z.coerce.string().default(path.basename(dirpath)),
            packageId: PackageId,
            author: z.coerce.string().optional(),
            url: z.coerce.string().optional(),
            modVersion: z.coerce.string().optional(),
            description: z.coerce.string().optional(),
            supportedVersions: XMLList(z.coerce.string()).optional(),
            modDependencies: XMLList(ModDependency).optional(),
            loadBefore: XMLList(PackageId).optional(),
            loadAfter: XMLList(PackageId).optional(),
            forceLoadBefore: XMLList(PackageId).optional(),
            forceLoadAfter: XMLList(PackageId).optional(),
            incompatibleWith: XMLList(PackageId).optional(),
        });

        // export const ModMetaData = (dirpath: string) => z.union([
        //     z.object({ ModMetaData: ModMetaDataScehema(dirpath) }),
        //     z.object({ modMetaData: ModMetaDataScehema(dirpath) }),
        // ]).transform(v => ({ ModMetaData: "modMetaData" in v ? v.modMetaData : v.ModMetaData }));
    }




    export const Localization = z.object({
        name: z.string(),
        // localName: z.string(),
        keys: z.record(z.string(), z.string()),
    });




    export const GitInfo = z.object({
        url: z.string().url(),
        lastUpdate: z.number(),
    });
}


declare global {
    interface ModsConfig extends Schemes.XML.ModsConfig.Type { }
    interface UserConfig extends Schemes.UserStore.Type { }
    interface ModMetaData extends z.infer<ReturnType<typeof Schemes.XML.ModMetaData>> { }
    interface ModDependency extends z.output<typeof Schemes.XML.ModDependency> { }
    interface ModTag extends z.output<typeof Schemes.ModTag> { }
    interface ModTag_Visualdata extends Pick<ModTag, "name" | "color"> { }

    interface GitInfo extends z.output<typeof Schemes.GitInfo> { }

}

export default Schemes;