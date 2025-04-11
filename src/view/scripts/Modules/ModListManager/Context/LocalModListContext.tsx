import React from "react";
import { ModListContext } from "@Context/ModListContext";

export const LocalModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const modList = React.useContext(ModListContext);
    const [selectedModPath, setSelectedModPath] = React.useState<string>();
    const selectedMod = React.useMemo(() => modList.mods.find(m => m.dirPath == selectedModPath), [modList.mods, selectedModPath]);


    return {
        modList,
        selectedMod,
        selectedModPath, setSelectedModPath,
    }
}

export function LocalModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalModListContext.Provider value={useDate()}>{children}</LocalModListContext.Provider>
    )
}