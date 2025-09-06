import React from "react";
import { Mod, Mod_ALL } from "@Classes/Mod";
import { UserConfigStore } from "@Stores";
import { ContextStore, Store, StoreCompareType } from "@Stores/store";


/**@deprecated */
type ModsCollection = Record<PackageId, Mod_ALL>;



export const __GlobalStore__ = new ContextStore({
    isLoaded: new Store<boolean>({
        value: () => false,
    }),
    mods: new Store<ModsCollection>({
        value: () => ({}),
    }),
    loadingErrors: new Store<ModReadingProblem[]>({
        value: () => [],
    }),
}, [
    function LoadingMods() {
        // Load Mods
        React.useEffect(() => {
            __GlobalStores__.isLoaded.set(false);
            $invoke.getModList().then(async (res) => {
                if (res.success) {
                    const newMods: ModsCollection = {};

                    // const userConfig = UserConfigStore.get();

                    res.data.list.forEach(d => {
                        newMods[d.about.packageId] = Mod.create(d);
                    });

                    __GlobalStores__.mods.set(newMods);
                    __GlobalStores__.loadingErrors.set(res.data.errors);
                } else {
                    __GlobalStores__.mods.set({});
                    __GlobalStores__.loadingErrors.set([{ dirPath: "", message: "Something Wrong" }]);
                }
                __GlobalStores__.isLoaded.set(true);
            });
        }, [UserConfigStore.use(uc => [uc.gamePath, uc.steamPath], StoreCompareType.PrimitiveArray)]);

        // Watch
        React.useEffect(() => {
            const onWorkshopContentChanged: on_listenerType<typeof $on.ModList_Changed> = (e, ...data) => {
                if (data[0] == "add") {
                    const d = data[1];
                    if (d.success) {
                        // const userConfig = UserConfigStore.get();
                        __GlobalStores__.mods.set(mods => ({
                            ...mods, [d.data.dirPath]: Mod.create(d.data)
                        }));
                    } else __GlobalStores__.loadingErrors.set(errors => [...errors, d.error]);
                } else if (data[0] == "remove") {
                    __GlobalStores__.mods.set(mods => {
                        const targetId = Object.values(mods).find(m => m.dirPath == data[1])?.about.packageId;
                        if (targetId) {
                            delete mods[targetId];
                            return { ...mods };
                        }
                        return mods;
                    });

                    __GlobalStores__.loadingErrors.set(errors => {
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
    },
]);
export const __GlobalStores__ = __GlobalStore__.stores;