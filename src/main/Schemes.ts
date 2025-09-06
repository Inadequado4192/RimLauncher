import path from "path";
import { z } from "zod";
import { app } from "electron";
import { DebugPathesSpace, FindPathes } from "./Pathes";


namespace Schemes {
    type ExportType<R extends z.ZodType, W extends z.ZodType> = {
        ReadOut: z.output<R>;
        ReadIn: z.input<R>;
        WriteOut: z.output<W>;
        WriteIn: z.input<W>;
    }

    const AnyToEmptyObject = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(any => typeof any === "object" && any !== null && !Array.isArray(any) ? any : {}, schema)
    function json<T extends z.ZodTypeAny>(type: T,): z.ZodPipe<z.ZodTransform<unknown, unknown>, T> {
        return z.preprocess((input, ctx) => {
            if (typeof input !== "string") return input
            try {
                return JSON.parse(input);
            } catch {
                ctx.addIssue({ code: "custom", message: "Invalid JSON", input })
                return z.NEVER;
            }
        }, type);
    }


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

        export const Read = AnyToEmptyObject(z.object({
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




    export namespace ModPack {
        export type Types = ExportType<typeof Read, typeof Write>;

        // const key = "ModPackData";


        export const Read = json(z.object({
            version: z.string().catch("0.0.0000 unknown"),
            activeMods: z.array(PackageId).catch([]),
        }));
        export const Write = z.object({
            version: z.string(),
            activeMods: z.array(PackageId),
        });
        // export const Read = z.union([
        //     AnyToEmptyObject(z.object({
        //         [key]: z.object({
        //             version: z.string().catch("0.0.0000 unknown"),
        //             activeMods: XMLList(PackageId).catch([]),
        //         })
        //     })).transform(res => res[key]),
        //     ModsConfig.Read,
        // ])

        // export const Write = z.object({
        //     version: z.coerce.string(),
        //     activeMods: z.array(PackageId),
        // }).transform(o => ({
        //     [key]: {
        //         version: o.version,
        //         activeMods: { li: o.activeMods },
        //     }
        // }));
    }




    export namespace XML {
        function XMLList<T extends z.ZodType>(t: T) {
            return z.union([
                z.literal("").transform(() => [] as never),
                z.object({ li: z.array(t) }).transform(l => l.li),
            ]).catch([]);
        }

        export namespace ModsConfig {
            export type Types = ExportType<typeof Read, typeof Write>;

            const Body = z.object({
                version: z.string().catch("0.0.0000 unknown"),
                activeMods: XMLList(PackageId).catch([]),
                knownExpansions: XMLList(PackageId).catch([]),
            });

            export const Read = AnyToEmptyObject(
                z.union([
                    z.object({ ModsConfigData: Body }),
                    z.object({ modsConfigData: Body }),
                    Body,
                ])
            ).transform(res => {
                if ("ModsConfigData" in res) return res.ModsConfigData;
                if ("modsConfigData" in res) return res.modsConfigData;
                return res;
            });

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


        export const ModDependency = z.object({
            displayName: z.coerce.string(),
            packageId: PackageId,
            steamWorkshopUrl: z.coerce.string(),
        })


        export const ModMetaData = (dirpath: string) => z.object({
            name: z.coerce.string().default(path.basename(dirpath)),
            packageId: PackageId,
            author: z.coerce.string().optional(),
            url: z.url().optional().catch(undefined),
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
    }


    export namespace GitInfo {
        export type Types = ExportType<typeof Read, typeof Write>;

        const Root = z.object({
            info: z.object({
                repoUrl: z.url(),
                user: z.string(),
                repo: z.string(),
                tree: z.string(),
                downloadZipUrl: z.url(),
            }),
            lastUpdate: z.number(),
            excludeFiles: z.array(z.string()).default([]),
            distDir: z.string().default("./")
        });

        export const Read = json(Root);
        export const Write = Root.transform(res => JSON.stringify(res, null, 4));
    }
}


declare global {
    interface UserConfig extends Schemes.UserStore.Type { }
    interface ModMetaData extends z.infer<ReturnType<typeof Schemes.XML.ModMetaData>> { }
    interface ModDependency extends z.output<typeof Schemes.XML.ModDependency> { }
    type ModTagJSON = z.output<typeof Schemes.ModTag>;

    
    type ModsConfig = Schemes.XML.ModsConfig.Types["ReadOut"];
    interface ModsConfig_Types extends Schemes.XML.ModsConfig.Types { }

    type ModPack = Schemes.ModPack.Types["ReadOut"];
    interface ModPack_Types extends Schemes.ModPack.Types { }

    type GitInfo = Schemes.GitInfo.Types["ReadOut"];
    interface GitInfo_Types extends Schemes.GitInfo.Types { }
}

export default Schemes;