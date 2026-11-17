import { z } from "zod";

export interface ConfigField<T> {
    readonly key: string;
    readonly schema: z.ZodType<T>;
    readonly defaultValue: T;
}

export const defineConfigField = <T>(key: string, schema: z.ZodType<T>, defaultValue: T): ConfigField<T> =>
    ({ key, schema, defaultValue });

export type RawConfig = Record<string, unknown>;