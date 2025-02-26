import { ipcRenderer } from "electron";
import React from "react";

export const ConfigContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [config, setConfig] = React.useState<UserConfig>();
    const [errors, setErrors] = React.useState<Awaited<ReturnType<typeof invoke.UserConfigValidate>>>();

    React.useEffect(() => {
        invoke.getUserConfig().then(setConfig);
        invoke.UserConfigValidate().then(setErrors);

        async function onCnfChange(e: Electron.IpcRendererEvent, data: UserConfig) {
            setConfig(data);
            setErrors(await invoke.UserConfigValidate());
        }
        on("changeConfig", onCnfChange);
        return () => {
            off("changeConfig", onCnfChange);
        }
    }, []);

    return {
        config, setConfig,
        errors, setErrors,
    }
}

export function ConfigContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <ConfigContext.Provider value={useDate()}>{children}</ConfigContext.Provider>
    )
}