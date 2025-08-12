import { Box, Sheet, Stack, Typography } from "@mui/joy";
import Actions from "./Actions";
import { GameInfoStore } from "@Stores";

export default function Footer() {
    const gameVersionFull = GameInfoStore.use(gi => gi.gameVersionFull)

    return (
        <Sheet>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-end"
            >
                <Box sx={{ p: 1 }}>
                    <Typography level="body-xs" noWrap>{gameVersionFull}</Typography>
                </Box>
                <Stack direction="row">
                    <Actions />
                </Stack>
            </Stack>
        </Sheet>
    )
}