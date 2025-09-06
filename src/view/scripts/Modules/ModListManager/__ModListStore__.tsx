import React from "react";
import { Mod_ALL, ModErrorType } from "@Classes/Mod";
import { ContextStore, Store, StoreCompareType } from "@Stores/store";
import Tag from "@Renderer/scripts/Classes/Tag";
import { ModsConfigStore, UserConfigStore } from "@Renderer/scripts/Stores";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";

export const __ModListStore__ = new ContextStore({

    actives: new Store<Mod_ALL[]>({
        value: () => [],
    }),
    unactives: new Store<Mod_ALL[]>({
        value: () => [],
    }),
    /**@deprecated Не дуже оптимізовано. Треба замінити. */
    modErrorsType: new Store<Record<PackageId, ModErrorType>>({
        value: () => ({}),
    }),

    unknownPackageIds: new Store<PackageId[]>({
        value: () => [],
    }),

    selectedMod: new Store<Mod_ALL | undefined>({
        value: undefined,
    }),
    filterByTags: new Store<Set<Tag>>({
        value: new Set(),
        clone: original => new Set(original)
    }),
    tags: new Store<Tag[]>({
        value: () => [],
    }),
}, [
    function UpdateTags() {
        const mods = __GlobalStores__.mods.use();

        // Update tag list
        const userTagsJSON = UserConfigStore.use(uc => uc.tags, Tag.Compare as any);
        React.useEffect(() => {
            const currentTags = __ModListStores__.tags.get();
            const newCollection: Tag[] = [];
            for (const ut of userTagsJSON) {
                const currentTag = currentTags.find(t => ut.name == t.name);

                let tag: Tag;
                if (currentTag) {
                    currentTag.update(ut);
                    tag = currentTag;
                } else {
                    tag = new Tag(ut);
                }

                newCollection.push(tag);
            }
            __ModListStores__.tags.set(newCollection);
        }, [userTagsJSON]);

        // Update tags for Mods
        const tags = __ModListStores__.tags.use();
        React.useEffect(() => {
            for (const pid in mods) {
                const mod = mods[pid as PackageId]!;
                const targetTags = [...tags].filter(t => t.packageIds.some(pid => mod.samePackageId(pid)));
                mod.tags = targetTags;
                mod.store.emit();
            }
        }, [mods, tags]);
    },
    function CreatingLists() {
        const mods = __GlobalStores__.mods.use();
        const activeMods = ModsConfigStore.use(mc => mc.activeMods, StoreCompareType.PrimitiveArray);

        // Creating Lists
        React.useEffect(() => {
            let unactives: Mod_ALL[] = [],
                actives: Mod_ALL[] = [];


            for (const pid in mods) {
                const mod = mods[pid as PackageId]!;
                if (mod.isActive()) actives.push(mod);
                else unactives.push(mod);
            }

            actives.sort((a, b) => {
                return activeMods.findIndex(p => a.samePackageId(p)) - activeMods.findIndex(p => b.samePackageId(p));
            });

            __ModListStores__.actives.set(actives);
            __ModListStores__.unactives.set(unactives);
        }, [mods, activeMods]);

    },
    function Errors() {
        const mods = __GlobalStores__.mods.use();
        const actives = __ModListStores__.actives.use();
        const activeMods = ModsConfigStore.use(mc => mc.activeMods, StoreCompareType.PrimitiveArray);

        // Finding Errors
        React.useEffect(() => {
            // console.time("ERRORS");
            const e = {} as Record<PackageId, ModErrorType>;
            for (const pid in mods) {
                const m = mods[pid as PackageId]!;
                e[m.about.packageId] = m.getErrorType();
            }
            __ModListStores__.modErrorsType.set(e);
            // console.timeEnd("ERRORS");
        }, [mods, actives]);


        React.useEffect(() => {
            if (!__GlobalStores__.isLoaded.get()) return;
            const unknownPackageIds: PackageId[] = [];

            for (const pid of activeMods) {
                if (!actives.some(m => m.samePackageId(pid))) {
                    unknownPackageIds.push(pid);
                }
            }

            __ModListStores__.unknownPackageIds.set(unknownPackageIds);
        }, [actives, activeMods]);
    },
    function UpdateModActivity() {
        const [prevList, sestPrevList] = React.useState<Mod_ALL[]>([]);
        const currentList = __ModListStores__.actives.use();

        React.useEffect(() => {
            for (const mod of currentList) {
                if (!prevList.some(pm => pm.about.packageId === mod.about.packageId)) mod.store.emit()
            }
            for (const mod of prevList) {
                if (!currentList.some(pm => pm.about.packageId === mod.about.packageId)) mod.store.emit()
            }
            sestPrevList(currentList);
        }, [currentList]);
    }
]);

export const __ModListStores__ = __ModListStore__.stores;