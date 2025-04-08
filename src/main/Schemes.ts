import path from "path";
import { z } from "zod";
import { app } from "electron";
import { DebugPathes, FindPathes } from "./Pathes";


namespace Schemes {
    const PackageId = z.string()
        .min(1, "Package ID is required.")
        .max(60, "Package ID must be 60 characters or less.")
        .regex(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/, "Package ID must contain only alphanumeric characters and dots, with at least one dot, and no repeated, leading, or trailing dots.")
        // .refine(id => !id.includes("Ludeon"), "Package ID cannot contain the word 'Ludeon'.")
        .transform(id => id.toLowerCase() as PackageId);



    export const StoreGet = z.object({
        steamPath: z.string().nullable().default(() => FindPathes.Steam() ?? null),
        gamePath: z.string().nullable().default(() => FindPathes.RimWorldGamePath() ?? null),
        closeWindowAfterRun: z.boolean().catch(false),
        language: z.string().catch(() => app.getSystemLocale()),
        tags: z.array(z.object({
            name: z.string(),
            color: z.string(),
            packageIds: z.array(PackageId)
        })).catch([]),
        lastCheckModUpdates: z.string().datetime().catch(new Date().toISOString())
    }).default({});
    type StoreGet = z.infer<typeof StoreGet>;

    export const StoreSet = z.object({
        steamPath: z.string().nullable(),
        // .superRefine((a, ctx) => {
        //     if (a === null) return;
        //     const res = DebugPathes.isSteam(a);
        //     if (!res.success) ctx.addIssue({ ...res, code: "custom" })
        // }),
        gamePath: z.string().nullable(),
        // .superRefine((a, ctx) => {
        //     if (a === null) return;
        //     const res = DebugPathes.isRimWorldGamePath(a);
        //     if (!res.success) ctx.addIssue({ ...res, code: "custom" })
        // }),
        closeWindowAfterRun: z.boolean(),
        language: z.string(),
        tags: z.array(z.object({
            name: z.string(),
            color: z.string(),
            packageIds: z.array(PackageId)
        })),
        lastCheckModUpdates: z.string().datetime()
    });



    export const StoreDebug = z.object({
        steamPath: z.string().superRefine((_path, ctx) => {
            const result = DebugPathes.isSteam(_path);
            if (!result.success) ctx.addIssue({ code: "custom", ...result });
        }),
        gamePath: z.string().superRefine((_path, ctx) => {
            const result = DebugPathes.isRimWorldGamePath(_path);
            if (!result.success) ctx.addIssue({ code: "custom", ...result });
        }),
    });





    export namespace XML {
        function XMLList<T extends z.ZodType>(t: T) {
            return z.union([
                z.literal("").transform(() => [] as never),
                z.object({ li: z.array(t) }).transform(l => l.li),
            ]).catch([]);
        }


        export const ModsConfig = z.object({
            version: z.string(),
            activeMods: XMLList(PackageId),
            knownExpansions: XMLList(PackageId),
        });


        export const ModDependency = z.object({
            displayName: z.string(),
            packageId: PackageId,
            steamWorkshopUrl: z.string(),
        })


        export const ModMetaData = (dirpath: string) => z.object({
            name: z.string().default(path.basename(dirpath)),
            packageId: PackageId,
            author: z.string().optional(),
            url: z.string().optional(),
            modVersion: z.coerce.string().optional(),
            description: z.string().optional(),
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
        keys: z.record(z.string()),
    });
}


type a = z.output<typeof Schemes.StoreGet._def.innerType>["tags"][number];
declare global {
    interface ModMetaData_Schema extends z.infer<ReturnType<typeof Schemes.XML.ModMetaData>> { }
    interface ModsConfig_Schema extends z.output<typeof Schemes.XML.ModsConfig> { }
    interface ModDependency extends z.output<typeof Schemes.XML.ModDependency> { }
    interface ModTag extends a { }
}

export default Schemes;



declare global {
    type UserConfig = z.output<typeof Schemes.StoreGet>;
}
