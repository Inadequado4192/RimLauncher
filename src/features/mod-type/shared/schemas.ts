import { PackageId } from "#features/base/shared";
import { XMLList } from "#features/XML/shared";
import z from "zod";

export const ModDependencyReadSchema = z.object({
    packageId: PackageId,
    displayName: z.coerce.string(),
    steamWorkshopUrl: z.coerce.string().optional(),
    downloadUrl: z.coerce.string().optional(),
});
export const ModMetaDataReadSchema = z.object({
    name: z.coerce.string().default(""),
    packageId: PackageId,
    author: z.coerce.string().optional(),
    url: z.url().optional().catch(undefined),
    modVersion: z.coerce.string().optional(),
    description: z.coerce.string().optional(),
    supportedVersions: XMLList(z.coerce.string()).transform(versions => [...new Set(versions)]).optional(),
    modDependencies: XMLList(ModDependencyReadSchema).optional(),
    loadBefore: XMLList(PackageId).optional(),
    loadAfter: XMLList(PackageId).optional(),
    forceLoadBefore: XMLList(PackageId).optional(),
    forceLoadAfter: XMLList(PackageId).optional(),
    incompatibleWith: XMLList(PackageId).optional(),
});

export const ModSchema = z.union([
    z.object({ ModMetaData: ModMetaDataReadSchema }),
    z.object({ modMetaData: ModMetaDataReadSchema }),
]).transform(d => {
    if ("ModMetaData" in d) return d.ModMetaData;
    else return d.modMetaData;
});

export type ModMetaData = z.output<typeof ModMetaDataReadSchema>;