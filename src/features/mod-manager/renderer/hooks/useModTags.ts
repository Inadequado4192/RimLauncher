import { ModTagsConfigField, ModTag } from "#features/mod-tag/shared";
import { samePackageId } from "#features/mod-core/shared";
import { ModEntry } from "#features/mod-type/shared";
import { getConfigField, useConfigField } from "#features/user-config/renderer";
import { useMemo } from "react";

export function useModTags(mod: ModEntry) {
    const tags = useConfigField(ModTagsConfigField);
    return useMemo(() => getModTagsFrom(mod, tags), [mod, tags]);
}

export function getModTags(mod: ModEntry) {
    return getModTagsFrom(mod, getConfigField(ModTagsConfigField));
}

export function getModTagsFrom(mod: ModEntry, tags: ModTag[]) {
    const enabled: ModTag[] = [], disabled: ModTag[] = [];

    for (const tag of tags) {
        if (tag.packageIds.some(p => samePackageId(mod, p)))
            enabled.push(tag);
        else
            disabled.push(tag);
    }

    return { enabled, disabled };
}