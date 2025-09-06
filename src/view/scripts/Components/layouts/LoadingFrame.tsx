import { loadingLocal } from "@Common/Localize";
import { GameInfoStore, UserConfigStore } from "@Stores";
import { Box, LinearProgress, Stack, Typography } from "@mui/joy";
import React from "react";
import LoadingFrameBody from "./LoadingFrameBody";

export default function LoadingFrame({
    children
}: {
    children?: React.ReactNode | React.ReactNode[]
}) {
    const gameInfo_isLoaded = GameInfoStore.use(gi => !!gi);
    const userConfig_isLoaded = UserConfigStore.use(uc => !!uc);
    const [localLoaded, setLocalLoaded] = React.useState(false);


    const [isLoaded, setLoaded] = React.useState(false);


    React.useEffect(() => {
        if (isLoaded) {
            console.log("%cLOADED", "color: green; font-weight: bold; font-size: 20px;");
            return;
        }
        setLocalLoaded(false);
        loadingLocal().then(() => setLocalLoaded(true));
    }, []);

    React.useEffect(() => {
        setLoaded(gameInfo_isLoaded && userConfig_isLoaded && localLoaded);
    }, [gameInfo_isLoaded, userConfig_isLoaded, localLoaded]);

    return isLoaded ? children : <LoadingFrameBody />;
}