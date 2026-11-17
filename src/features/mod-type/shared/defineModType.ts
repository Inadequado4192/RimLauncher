import { z } from "zod";
import { ModMetaData } from "./schemas";

export interface ModEntry<D = unknown> {
    type: string;
    data: D;
    about: ModMetaData;
    previewPath?: string;
    iconPath?: string;

    // warnings?: LocalizedString[];

    dirPath: string;
}


export function defineModType<T>(id: string, schema: z.ZodType<T>) {
    return {
        id, schema,
        is: (m: ModEntry): m is ModEntry<T> => m.type === id,
    };
}
export type DefinedMod<T = unknown> = ReturnType<typeof defineModType<T>>;