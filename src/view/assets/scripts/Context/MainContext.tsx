import React from "react";

export const MainContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [output, setOutput] = React.useState<{
        [KEY: string]: { type: "info" | "error" | "warn" | "success", msg: string }
    }>({});

    return {
        output, setOutput,
    }
}

export function MainContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <MainContext.Provider value={useDate()}>{children}</MainContext.Provider>
    )
}