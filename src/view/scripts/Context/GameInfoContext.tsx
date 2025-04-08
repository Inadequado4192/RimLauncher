import React from "react";

export const GameInfoContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const [gameInfo, setGameInfo] = React.useState<GameInfoData>()

    React.useEffect(() => {
        invoke.getGameInfo().then(res => {
            if (res.success) setGameInfo(res.data);
        });
    }, []);

    return { gameInfo };
}
export function GameInfoContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <GameInfoContext.Provider value={useDate()}>{children}</GameInfoContext.Provider>
    )
}