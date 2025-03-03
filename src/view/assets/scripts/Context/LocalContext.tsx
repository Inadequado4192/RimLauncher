import React from "react";

export const LocalContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [local, setLocal] = React.useState<SomeLocal>();
    
    React.useEffect(() => {
        invoke.getTargetLocalJSON().then(setLocal);
    }, []);

    return { local, setLocal };
}

export function LocalContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalContext.Provider value={useDate()}>{children}</LocalContext.Provider>
    )
}