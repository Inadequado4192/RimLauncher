import React from "react";

export const ModsConfigContext = React.createContext<ReturnType<typeof useDate>>(null as any);

// export let modsConfigRef: ModsConfig_Schema;
function useDate() {
    const [modsConfig, setModsConfig] = React.useState<ModsConfig_Schema>();

    React.useEffect(() => {
        invoke.getModsConfig().then(data => setModsConfig(data));

        // Watch
        const onChangeModsConfigFile: on_listenerType<typeof on.changeModsConfigFile> = (e, data) => {
            setModsConfig(data);
        }

        on.changeModsConfigFile(onChangeModsConfigFile);
        return () => {
            off.changeModsConfigFile(onChangeModsConfigFile);
        }
    }, []);

    return modsConfig;
}

export function ModsConfigContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <ModsConfigContext.Provider value={useDate()}>{children}</ModsConfigContext.Provider>
    )
}