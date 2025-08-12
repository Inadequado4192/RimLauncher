import React from "react";
import { Mod, Mod_ALL, ModErrorType } from "@Classes/Mod";
import { ModsConfigStore, UserConfigStore } from "@Stores";
import { Store, StoreCompares, StoreCompareType } from "@Stores/store";

const ModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

/**
 * @key Path to mod's dir
 * @value Mod object
 */
type ModsCollection = Record<string, Mod_ALL>;



function useDate() {
    const userTagsConnections = UserConfigStore.use(uc => uc.tags, (p, n) => StoreCompares._isEqualBy(p, n, x => x.packageIds));

    const activeMods = ModsConfigStore.use(mc => mc.activeMods, StoreCompareType.PrimitiveArray);
    const mods = ModListStore.mods.use();
    const actives = ModListStore.actives.use();

    React.useEffect(() => () => ModListStore._clear(), []);


    // Load Mods
    React.useEffect(() => {
        $invoke.getModList().then(async (res) => {
            if (res.success) {
                const newMods: ModsCollection = {};

                const userConfig = UserConfigStore.get();

                res.data.list.forEach(d => {
                    newMods[d.dirPath] = Mod.create(d, {
                        tags: Mod.getTags(userConfig.tags, d.about.packageId),
                    });
                });

                ModListStore.mods.set(newMods);
                ModListStore.loadingErrors.set(res.data.errors);
            } else {
                ModListStore.mods.set({});
                ModListStore.loadingErrors.set([{ dirPath: "", message: "Something Wrong" }]);
            }
            ModListStore.isLoaded.set(true);
        });
    }, [UserConfigStore.use(uc => [uc.gamePath, uc.steamPath], StoreCompareType.PrimitiveArray)]);

    // Watch
    React.useEffect(() => {
        const onWorkshopContentChanged: on_listenerType<typeof $on.ModList_Changed> = (e, ...data) => {
            if (data[0] == "add") {
                const d = data[1];
                if (d.success) {
                    const userConfig = UserConfigStore.get();
                    ModListStore.mods.set(mods => ({
                        ...mods, [d.data.dirPath]: Mod.create(d.data, {
                            tags: Mod.getTags(userConfig.tags, d.data.about.packageId),
                        })
                    }));
                } else ModListStore.loadingErrors.set(errors => [...errors, d.error]);
            } else if (data[0] == "remove") {
                ModListStore.mods.set(mods => {
                    delete mods[data[1]];
                    return { ...mods };
                });

                ModListStore.loadingErrors.set(errors => {
                    const w_ind = errors.findIndex(w => w.dirPath == data[1]);
                    if (w_ind >= 0) {
                        errors.splice(w_ind, 1);
                        return [...errors];
                    }
                    return errors;
                });
            }
        }
        $on.ModList_Changed(onWorkshopContentChanged);
        return () => {
            $off.ModList_Changed(onWorkshopContentChanged);
        }
    }, []);

    // Update Tags
    React.useEffect(() => {
        for (const path in mods) {
            const mod = mods[path]!;
            const tags = userTagsConnections.filter(ar => ar.packageIds.includes(mod.about.packageId)).map(a => a);
            if (JSON.stringify(mod.tags.map(t => t.name)) !== JSON.stringify(tags.map(t => t.name))) {
                mod.tags = tags;
                mod.store.emit();
            }
        }
    }, [mods, userTagsConnections]);

    // Creating Lists
    React.useEffect(() => {
        let unactives: Mod_ALL[] = [],
            actives: Mod_ALL[] = [];

        for (const path in mods) {
            const mod = mods[path]!;
            if (mod.isActive()) actives.push(mod);
            else unactives.push(mod);
        }
        // unactives = mods.filter(m => !m.isActive());
        // actives = mods.filter(m => m.isActive())
        actives.sort((a, b) => {
            return activeMods.findIndex(p => a.samePackageId(p)) - activeMods.findIndex(p => b.samePackageId(p));
        });

        ModListStore.actives.set(actives);
        ModListStore.unactives.set(unactives);
    }, [mods, activeMods]);

    // Finding Errors
    React.useEffect(() => {
        const e = {} as Record<PackageId, ModErrorType>;
        for (const path in mods) {
            const m = mods[path]!;
            e[m.about.packageId] = m.getErrorType();
        }
        ModListStore.modErrorsType.set(e);
    }, [mods, actives]);
}

export function ModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    const data = useDate();
    return (
        <ModListContext.Provider value={data}>{children}</ModListContext.Provider>
    )
}

export namespace ModListStore {
    export function _clear() {
        isLoaded.setWithoutEmit(false);
        mods.setWithoutEmit({});
        actives.setWithoutEmit([]);
        unactives.setWithoutEmit([]);
        modErrorsType.setWithoutEmit({});
        loadingErrors.setWithoutEmit([]);
    }


    export const isLoaded = new Store<boolean>({
        firstLoad: () => false,
    });
    export const mods = new Store<ModsCollection>({
        firstLoad: () => ({}),
    });
    export const actives = new Store<Mod_ALL[]>({
        firstLoad: () => [],
    });
    export const unactives = new Store<Mod_ALL[]>({
        firstLoad: () => [],
    });
    export const modErrorsType = new Store<Record<PackageId, ModErrorType>>({
        firstLoad: () => ({}),
    });
    export const loadingErrors = new Store<ModReadingProblem[]>({
        firstLoad: () => [],
    });
}