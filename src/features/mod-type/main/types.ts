import { Promisable } from "#features/base/shared";
import { LocalizedString } from "#features/localization/shared";
import z from "zod";
import { DefinedMod } from "../shared";

export interface DetectContext {
    dirPath: string;
    aboutDirPath: string;
    parentDir: string;
}

export interface DetectResult<D = unknown> {
    data: D;
    warnings?: LocalizedString[];
}

export interface ModTypeProvider2<T extends DefinedMod = DefinedMod> {
    id: string;
    priority: number;
    detect(ctx: DetectContext): Promisable<z.output<T["schema"]> | null>;
}
