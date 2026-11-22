import { PackageIdAny } from "#features/app/shared";
import { ModEntry } from "#features/mod-type/shared";

export function samePackageId(a1: PackageIdAny | ModEntry, a2: PackageIdAny | ModEntry, _ignorePostfix = false) {
    const id1 = typeof a1 === "string" ? a1 : a1.about.packageId.toLowerCase();
    const id2 = typeof a2 === "string" ? a2 : a2.about.packageId.toLowerCase();
    return id1 === id2;
}