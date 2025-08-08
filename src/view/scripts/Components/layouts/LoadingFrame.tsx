import { loadingLocal } from "@Common/Localize";
import { GameInfoStore, UserConfigStore } from "@Stores";
import { Box, LinearProgress, Stack, Typography } from "@mui/joy";
import React from "react";

export function LoadingFrame({
    children
}: {
    children: React.ReactNode | React.ReactNode[]
}) {
    const gameInfo = GameInfoStore.use();
    const userConfig = UserConfigStore.use();
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
        setLoaded(gameInfo && userConfig && localLoaded);
    }, [gameInfo, userConfig, localLoaded]);

    return isLoaded ? children : (
        <Stack
            alignItems="center"
            justifyContent="center"
            flex={1}
            spacing={2}
            sx={{
                position: "fixed",
                left: 0, bottom: 0,
                top: 0, right: 0,
                // opacity: isLoaded ? 1 : 0,
                // transition: isReloading ? "0s" : "1s",
                zIndex: 9999999,
                // pointerEvents: isReloading ? undefined : "none"
            }}
        >
            <Typography color="neutral" level="h1">Loading...</Typography>
            <Box width={300}>
                <LinearProgress variant="soft" color="neutral" value={25} />
            </Box>
        </Stack>
    )
}