import { IconButton, Stack, SvgIcon, Typography } from "@mui/joy";
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
                <Typography level="body-xs">{TITLE}</Typography>
            </Stack>
            <Stack direction="row">
                <IconButton color="neutral" onClick={() => $invoke.winMinimize()}><MiddleMinimizeIcon /></IconButton>
                <IconButton color="neutral" onClick={() => $invoke.winToggleMaximize()}><CropSquareIcon /></IconButton>
                <IconButton color="danger" onClick={() => $invoke.winClose()}><CloseIcon /></IconButton>
            </Stack>
        </Stack>
    )
}

const MiddleMinimizeIcon = () => <SvgIcon focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="MinimizeIcon"><path d="M6 12h12v2H6z"></path></SvgIcon>
