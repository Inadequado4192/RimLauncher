import React from "react";

export const UserConfigContext = React.createContext<UserConfigContextType>(null as any);

export type UserConfigContextType = ReturnType<typeof useDate>;
function useDate() {
    const [userConfig, setConfig] = React.useState<UserConfig>();

    React.useEffect(() => {
        invoke.getUserConfig().then(setConfig);

        const onCnfChange: on_listenerType<typeof on.changeUseConfig> = (e, data) => {
            setConfig(data);
        }
        on.changeUseConfig(onCnfChange);
        return () => {
            off.changeUseConfig(onCnfChange);
        }
    }, []);

    return {
        userConfig, setConfig,
        // errors, setErrors,
    }
}

export function UserConfigContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <UserConfigContext.Provider value={useDate()}>{children}</UserConfigContext.Provider>
    )
}