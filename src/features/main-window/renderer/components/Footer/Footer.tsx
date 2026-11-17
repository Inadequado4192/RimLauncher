import { useGameInfo } from "#features/game-info/renderer";
import { Box, ButtonGroup, Sheet, Stack, Typography } from "@mui/joy";
import { BugReportButton, CheckAppUpdates, KoFiButton, OpenPath, RunGameButton, UserConfigButton } from "./Actions";

export function Footer() {
    const gameVersionFull = useGameInfo(gi => gi.info?.gameVersionFull);
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
                    <ButtonGroup
                        sx={{
                            "& > button": {
                                "--ButtonGroup-radius": "0px",
                                borderRight: "none !important",
                                borderBottom: "none !important",
                                "&:not(:first-of-type)": {
                                    borderLeft: "none !important",
                                },
                                whiteSpace: "nowrap"
                            }
                        }}
                    >
                        <CheckAppUpdates />
                        <BugReportButton />
                        <KoFiButton />
                        <OpenPath />
                        <UserConfigButton />
                        <RunGameButton />
                    </ButtonGroup>
                </Stack>
            </Stack>
        </Sheet>
    )
}
