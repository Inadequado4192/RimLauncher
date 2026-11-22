import { PackageId } from "#features/app/shared";
import z from "zod";

export const modTagWriteSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1),
    color: z.string(),
    packageIds: z.array(PackageId)
});

export const modTagReadSchema = modTagWriteSchema.extend({
    id: modTagWriteSchema.shape.id.default(() => crypto.randomUUID()),
    name: modTagWriteSchema.shape.name.default("unknown name"),
    color: modTagWriteSchema.shape.color.default("#ffffff"),
    packageIds: modTagWriteSchema.shape.packageIds.default(() => [])
});

export const modTagPatchSchema = modTagWriteSchema.omit({ id: true }).partial();

export const modTagCreateSchema = modTagWriteSchema.omit({ id: true })
    .extend({
        packageIds: z.array(PackageId).default(() => []),
    });


export type ModTag = z.output<typeof modTagWriteSchema>;
export type ModTagCreate = z.input<typeof modTagCreateSchema>;
export type ModTagPatch = z.output<typeof modTagPatchSchema>;

export type TagView = Pick<ModTag, "id" | "name" | "color">;
