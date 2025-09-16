import React from "react";
import { Mod_ALL, ModErrorType } from "@Classes/Mod";
import { ContextStore, Store, StoreCompareType } from "@Stores/store";
import Tag from "@Renderer/scripts/Classes/Tag";
import { ModsConfigStore, UserConfigStore } from "@Renderer/scripts/Stores";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";

export const __ModListStore__ = new ContextStore({
    
    searchTextD: new Store<string>({ value: "", }),
    searchTextE: new Store<string>({ value: "", }),
    splitSearchInput: new Store<boolean>({ value: false, }),
    showModIcon: new Store<boolean>({ value: false, }),


    enabled: new Store<Mod_ALL[]>({ value: [], }),
    disabled: new Store<Mod_ALL[]>({ value: [], }),
    /**@deprecated Не дуже оптимізовано. Треба замінити. */
    modErrorsType: new Store<Record<PackageId, ModErrorType>>({ value: {} }),

    unknownPackageIds: new Store<PackageId[]>({ value: [] }),

    selectedMods: new Store<Mod_ALL[]>({ value: [] }),
    tags: new Store<Tag[]>({ value: [] }),
    filterByTags: new Store<Set<Tag>>({
        value: new Set(),
        clone: original => new Set(original)
    }),
}, [
    function UpdateTags() {
        // Update tag list
        React.useEffect(() => {
            function callback() {
                const currentTags = __ModListStores__.tags.get();
                const newCollection: Tag[] = [];
                for (const ut of UserConfigStore.get().tags) {
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
            }
            callback();

            return UserConfigStore.subscribe(callback);
        }, []);

        // Update tags for Mods
        React.useEffect(() => {
            function callback() {
                const mods = __GlobalStores__.mods.get();
                const tags = __ModListStores__.tags.get();
                for (const pid in mods) {
                    const mod = mods[pid as PackageId]!;
                    const targetTags = [...tags].filter(t => t.packageIds.some(pid => mod.samePackageId(pid)));
                    mod.tags = targetTags;
                    mod.store.emit();
                }
            }
            callback();

            const subs = [
                __GlobalStores__.mods.subscribe(callback),
                __ModListStores__.tags.subscribe(callback),
            ]
            return () => subs.forEach(c => c());
        }, []);
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

            __ModListStores__.enabled.set(actives);
            __ModListStores__.disabled.set(unactives);
        }, [mods, activeMods]);

    },
    function Errors() {
        const mods = __GlobalStores__.mods.use();
        const actives = __ModListStores__.enabled.use();
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
        const currentList = __ModListStores__.enabled.use();

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