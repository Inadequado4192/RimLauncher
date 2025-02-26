import { IconButton, Stack, Typography } from "@mui/joy";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";


export default function TitleBar() {
    return (
        <Stack direction="row" sx={{ userSelect: "none" }}>
            <Stack
                direction="row"
                flex={1}
                p={1}
                sx={{ appRegion: "drag" }}
            >
                <Typography level="body-xs">RimLauncher</Typography>
            </Stack>
            <Stack
                direction="row"
                sx={{
                    "& button": {
                        borderRadius: 0
                    }
                }}
            >
                <IconButton color="neutral" onClick={() => invoke.winMinimize()}><MinimizeIcon /></IconButton>
                <IconButton color="neutral" onClick={() => invoke.winToggleMaximize()}><CropSquareIcon /></IconButton>
                <IconButton color="danger" onClick={() => invoke.winClose()}><CloseIcon /></IconButton>
            </Stack>
        </Stack>
    )
}