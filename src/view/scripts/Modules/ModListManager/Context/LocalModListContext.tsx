import React from "react";
import { ModListContext } from "@Context/ModListContext";
import { Mod } from "@Classes/Mod";

export const LocalModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const modList = React.useContext(ModListContext);


    const [lastSelectedR_Path, set_lastSelectedR_Path] = React.useState<string>();
    const [lastSelectedL_Path, set_lastSelectedL_Path] = React.useState<string>();
    const [selectedMod, setSelectedMod] = React.useReducer<Mod | undefined, [mod: Mod] | [modPath: string] | [undefined]>((state, value) => {
        const path = typeof value == "string" ? value : value instanceof Mod ? value.dirPath : undefined;
        
        const m = modList.mods.find(m => m.dirPath == path);

        if (m) {
            if (m.isActive()) set_lastSelectedR_Path(path);
            else set_lastSelectedL_Path(path);
        }
            
        return m
    }, undefined);

    React.useEffect(() => {
        if (selectedMod) {
            if (selectedMod.isActive()) set_lastSelectedR_Path(selectedMod.dirPath);
            else set_lastSelectedL_Path(selectedMod.dirPath);
        }

        if (modList.unactives.some(m => m.dirPath == lastSelectedR_Path)) set_lastSelectedR_Path(undefined);
        if (modList.actives.some(m => m.dirPath == lastSelectedL_Path)) set_lastSelectedL_Path(undefined);
    }, [modList.mods]);



    return {
        modList,
        selectedMod, setSelectedMod,
        lastSelectedR_Path, set_lastSelectedR_Path,
        lastSelectedL_Path, set_lastSelectedL_Path,
    }
}

export function LocalModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalModListContext.Provider value={useDate()}>{children}</LocalModListContext.Provider>
    )
}