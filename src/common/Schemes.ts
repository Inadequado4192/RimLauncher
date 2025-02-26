import path from "path";
import fs from "fs";
import { z } from "zod";

namespace Schemes {
    export const StoreGet = z.object({
        pathes: z.object({
            steam: z.string().catch(""),
            game: z.string().catch(""),
        }).default({}),
        closeWindowAfterRun: z.boolean().catch(false),
        runArg: z.string().optional().catch(undefined),
        language: z.string().catch("English")
    }).default({});


    export const StoreSet = z.object({
        pathes: z.object({
            steam: z.preprocess(d => d === "" ? void 0 : d, z.string()),
            game: z.preprocess(d => d === "" ? void 0 : d, z.string()),
        }),
        closeWindowAfterRun: z.boolean(),
        runArg: z.preprocess(v => !String(v).trim() ? undefined : String(v).trim(), z.string()),
        language: z.string(),
    });



    export const StoreDebug = z.object({
        pathes: z.object({
            game: z.string().superRefine((_path, ctx) => {
                try {
                    if (!_path) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "The path is undefined",
                        fatal: true
                    });

                    if (!fs.existsSync(_path)) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "The path does not exist",
                        fatal: true
                    });

                    if (!fs.existsSync(path.join(_path, "steam_appid.txt"))) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "This may be the wrong directory",
                        fatal: true
                    });

                    if (fs.readFileSync(path.join(_path, "steam_appid.txt")).toString() !== "294100") return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "This is not Rimworld",
                        fatal: true
                    });
                } catch (e) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: JSON.stringify(e),
                        fatal: true
                    });
                }
            }),
            steam: z.string().superRefine((_path, ctx) => {
                try {
                    if (!_path) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "The path is undefined",
                        fatal: false
                    });

                    if (!fs.existsSync(_path)) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "The path does not exist",
                        fatal: true
                    });

                    if (!fs.readdirSync(_path).includes("steam.exe")) return ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "This may be the wrong directory.",
                        fatal: false
                    });
                } catch (e) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: JSON.stringify(e),
                        fatal: true
                    });
                }
            }),
            // config: z.string().superRefine((_path, ctx) => {
            //     try {
            //         if (!_path) return ctx.addIssue({
            //             code: z.ZodIssueCode.custom,
            //             message: "The path is undefined",
            //             fatal: true
            //         });

            //         if (path.basename(_path) !== "ModsConfig.xml") return ctx.addIssue({
            //             code: z.ZodIssueCode.custom,
            //             message: "This may be ModsConfig.xml",
            //             fatal: true
            //         });
            //     } catch (e) {
            //         ctx.addIssue({
            //             code: z.ZodIssueCode.custom,
            //             message: JSON.stringify(e),
            //             fatal: true
            //         });
            //     }
            // }),
        })
    });




    export namespace XML {
        const PackageId = z.string()
            .min(1, "Package ID is required.")
            .max(60, "Package ID must be 60 characters or less.")
            .regex(/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/, "Package ID must contain only alphanumeric characters and dots, with at least one dot, and no repeated, leading, or trailing dots.")
            // .refine(id => !id.includes("Ludeon"), "Package ID cannot contain the word 'Ludeon'.")
            .transform(id => id.toLowerCase() as PackageId);

        function XMLList<T extends z.ZodType>(t: T) {
            return z.object({ li: z.array(t) }).transform(l => l.li).catch([]);
        }
        const ModMetaDataScehema = (dirpath: string) => z.object({
            name: z.string().default(path.basename(dirpath)),
            packageId: PackageId,
            author: z.string().optional(),
            url: z.string().optional(),
            modVersion: z.coerce.string().optional(),
            description: z.string().optional(),
            supportedVersions: XMLList(z.coerce.string()).optional(),
            modDependencies: XMLList(z.object({
                displayName: z.string(),
                packageId: PackageId,
                steamWorkshopUrl: z.string(),
            })).optional(),
            loadBefore: XMLList(PackageId).optional(),
            loadAfter: XMLList(PackageId).optional(),
            forceLoadBefore: XMLList(PackageId).optional(),
            forceLoadAfter: XMLList(PackageId).optional(),
            incompatibleWith: XMLList(PackageId).optional(),
        });
        export const ModMetaData = (dirpath: string) =>  z.union([
            z.object({ ModMetaData: ModMetaDataScehema(dirpath) }),
            z.object({ modMetaData: ModMetaDataScehema(dirpath) }),
        ]).transform(v => ({ ModMetaData: "modMetaData" in v ? v.modMetaData : v.ModMetaData }));
    }




    export const Localization = z.object({
        name: z.string(),
        localName: z.string(),
        keys: z.record(z.string()),
    });
}


declare global {
    type ModMetaData2 = z.infer<ReturnType<typeof Schemes.XML.ModMetaData>>["ModMetaData"]
}

export default Schemes;



declare global {
    type UserConfig = z.output<typeof Schemes.StoreGet>;
}
