import { useDict } from "#features/localization/renderer";
import {  useConfigLoaded } from "#features/user-config/renderer";
import { Box, LinearProgress, Stack } from "@mui/joy";
import React from "react";


export function LoadingFrame({
    children
}: {
    children?: React.ReactNode | React.ReactNode[]
}) {
    const userConfig = useConfigLoaded();
    const dict = useDict(s => s.dict);

    const isLoaded = userConfig && !!dict;

    if (isLoaded) return children;

    return (
        <Stack
            alignItems="center"
            justifyContent="center"
            flex={1}
            gap={2}
        >
            <Box width={300}>
                <LinearProgress variant="soft" color="neutral" />
            </Box>
        </Stack>
    )
}