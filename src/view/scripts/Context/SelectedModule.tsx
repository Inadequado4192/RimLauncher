import React from "react";

export const SelectedModuleContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    // const [module, setModule] 
    return { };
}

export function SelectedModuleContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <SelectedModuleContext.Provider value={useDate()}>{children}</SelectedModuleContext.Provider>
    )
}