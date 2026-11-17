import { fullVersionSchema, PackageId, shortVersionSchema } from "#features/app/shared";
import z from "zod";


export const modReferenceReadSchema = z.object({
    name: z.string().optional(),
    packageId: PackageId,
    sourceUrl: z.httpUrl().optional(),
});

export const modReferenceWriteSchema = modReferenceReadSchema.extend({
    name: z.string().min(1).optional(),
    packageId: PackageId,
    sourceUrl: z.httpUrl().optional(),
});

export const modPackReadSchema = z.object({
    name: z.string().default("UNKNOWN NAME"),
    gameVersion: shortVersionSchema.default("1.0"),
    packVersion: fullVersionSchema.default("1.0.0"),
    mods: z.array(modReferenceReadSchema).default([]),
});

export const modPackWriteSchema = modPackReadSchema.extend({
    name: z.string().min(1),
    gameVersion: z.string().min(1),
    packVersion: z.string().min(1),
    mods: z.array(modReferenceReadSchema).default([]),
});

export type ModPack = z.output<typeof modPackReadSchema>;
export type ModPackWrite = z.input<typeof modPackWriteSchema>;


export type ModPackReference = z.output<typeof modReferenceReadSchema>;

