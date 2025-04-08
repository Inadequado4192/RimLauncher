import React from "react";
import { ModListContext } from "@Context/ModListContext";

export const LocalModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const modList = React.useContext(ModListContext);
    const [selectedModId, setSelectedModId] = React.useState<PackageId>();
    const selectedMod = React.useMemo(() => selectedModId && modList.mods.find(m => m.samePackageId(selectedModId)), [modList.mods, selectedModId]);


    return {
        modList,
        selectedMod,
        selectedModId, setSelectedModId,
    }
}

export function LocalModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalModListContext.Provider value={useDate()}>{children}</LocalModListContext.Provider>
    )
}