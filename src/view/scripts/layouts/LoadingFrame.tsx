import { loadingLocal } from "@Common/Localize";
import { GameInfoContext } from "@Context/GameInfoContext";
import { ReloadContext } from "@Context/ReloadContext";
import { UserConfigContext } from "@Context/UserConfigContext";
import { Box, LinearProgress, Stack, Typography } from "@mui/joy";
import React from "react";

export function LoadingFrame({
    children
}: {
    children: React.ReactNode | React.ReactNode[]
}) {
    const { userConfig: config } = React.useContext(UserConfigContext);
    const { gameInfo } = React.useContext(GameInfoContext);
    const [localLoaded, setLocalLoaded] = React.useState(false);
    const { isReloading, setReload } = React.useContext(ReloadContext);


    React.useEffect(() => {
        if (!isReloading) return;
        setLocalLoaded(false);
        loadingLocal().then(() => setLocalLoaded(true));
    }, [isReloading]);

    React.useEffect(() => {
        setReload(!gameInfo || !localLoaded || !config);
    }, [gameInfo, localLoaded, config]);

    return (
        <>
            {!isReloading && children}
            <Stack
                alignItems="center"
                justifyContent="center"
                flex={1}
                spacing={2}
                sx={{
                    position: "fixed",
                    left: 0, bottom: 0,
                    top: 0, right: 0,
                    opacity: isReloading ? 1 : 0,
                    transition: isReloading ? "0s" : "1s",
                    zIndex: 9999999,
                    pointerEvents: isReloading ? undefined : "none"
                }}
            >
                <Typography color="neutral" level="h1">Loading...</Typography>
                <Box width={300}>
                    <LinearProgress variant="soft" color="neutral" value={25} />
                </Box>
            </Stack>
        </>
    );
}