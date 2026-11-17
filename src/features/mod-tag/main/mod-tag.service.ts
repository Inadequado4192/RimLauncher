import { handle, Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { ModTag, modTagCreateSchema, ModTagIpc, modTagPatchSchema, ModTagsConfigField } from "../shared";
import { UserConfigService } from "#features/user-config/main";
import z from "zod";

@injectable()
export class ModTagService implements Initializable {
    public constructor(
        private _userConfigService: UserConfigService
    ) { }

    public initialize() {
        this._userConfigService.registerField(ModTagsConfigField);

        handle(ModTagIpc.Create, async (_, input) => {
            const safeModTag = modTagCreateSchema.parse(input);
            const tag: ModTag = { ...safeModTag, id: crypto.randomUUID() };
            await this._userConfigService.updateField(
                ModTagsConfigField,
                (list) => [...list, tag],
            );
        });

        handle(ModTagIpc.Patch, async (_, id, patchInput) => {
            const tagId = z.uuid().parse(id);
            const safePatch = modTagPatchSchema.parse(patchInput);

            await this._userConfigService.updateField(ModTagsConfigField, (list) => {
                const index = list.findIndex((t) => t.id === tagId);
                if (index === -1) throw new Error("mod-tag.errors.notFound");

                return list.map((t) => (t.id === tagId ? { ...t, ...safePatch } : t));
            });
        });

        handle(ModTagIpc.Delete, async (_, id) => {
            const tagId = z.uuid().parse(id);

            await this._userConfigService.updateField(ModTagsConfigField, (list) => {
                const index = list.findIndex((t) => t.id === tagId);
                if (index === -1) throw new Error("mod-tag.errors.notFound");

                return list.filter(t => t.id !== tagId);
            });
        });
    }

}