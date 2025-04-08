import React from "react";

export const ReloadContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [isReloading, setReload] = React.useState(true);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    function reload() {
        setReload(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setReload(false), 1000);
    }

    return { isReloading, setReload, reload };
}

export function ReloadContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <ReloadContext.Provider value={useDate()}>{children}</ReloadContext.Provider>
    )
}