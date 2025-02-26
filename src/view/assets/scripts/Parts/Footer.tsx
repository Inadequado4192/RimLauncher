import { Box, Sheet, Stack, Typography } from "@mui/joy";
import Actions from "./Actions";
import React from "react";
import { GameInfoContext } from "../Context/GameInfoContext";

export default function Footer() {
    const { gameInfo } = React.useContext(GameInfoContext);

    return (
        <Sheet>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
            >
                <Box sx={{ p: 1 }}>
                    <Typography level="body-xs">{gameInfo?.gameVersionFull}</Typography>
                </Box>
                <Stack
                    direction="row"
                >

                    <Actions />
                </Stack>
            </Stack>
        </Sheet>
    )
}