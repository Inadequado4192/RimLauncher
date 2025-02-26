import React from "react";

export const LocalContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [local, setLocal] = React.useState<SomeLocal>();
    
    React.useEffect(() => {
        invoke.getTargetLocalJSON().then(setLocal);
    }, []);

    function Localize(key: keyof SomeLocal["keys"] | (string & {}), args?: any[]) {
        return local?.keys[key as keyof SomeLocal["keys"]] ?? key;
    }
    
    return { local, setLocal, Localize };
}

export function LocalContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <LocalContext.Provider value={useDate()}>{children}</LocalContext.Provider>
    )
}