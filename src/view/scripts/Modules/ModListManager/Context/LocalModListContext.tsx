import React from "react";
import { Mod, Mod_ALL } from "@Classes/Mod";
import { ModListStore } from "@Context/ModListContext";
import { Store } from "@Stores/store";

const LocalModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    // const actives = ModListStore.actives.use();
    // const unactives = ModListStore.unactives.use();

    React.useEffect(() => () => LocalModListStores._clear(), []);

    // const [lastSelectedR_Path, set_lastSelectedR_Path] = React.useState<string>();
    // const [lastSelectedL_Path, set_lastSelectedL_Path] = React.useState<string>();

    // React.useEffect(() => {
    //     const selectedMod = LocalModListStores.selectedMod.get();
    //     if (selectedMod) {
    //         if (selectedMod.isActive()) set_lastSelectedR_Path(selectedMod.dirPath);
    //         else set_lastSelectedL_Path(selectedMod.dirPath);
    //     }

    //     if (unactives.some(m => m.dirPath == lastSelectedR_Path)) set_lastSelectedR_Path(undefined);
    //     if (actives.some(m => m.dirPath == lastSelectedL_Path)) set_lastSelectedL_Path(undefined);
    // }, [unactives, actives]);




    // return {
    //     lastSelectedR_Path, set_lastSelectedR_Path,
    //     lastSelectedL_Path, set_lastSelectedL_Path,
    // }
}

export function LocalModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalModListContext.Provider value={useDate()}>{children}</LocalModListContext.Provider>
    )
}
export namespace LocalModListStores {
    export function _clear() {
        selectedMod.setWithoutEmit(undefined);
    }

    export const selectedMod = new Store<Mod_ALL | undefined>({
        firstLoad: async () => undefined,
    });
}