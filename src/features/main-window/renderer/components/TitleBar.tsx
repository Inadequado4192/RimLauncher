import { IconButton, Stack, SvgIcon, Typography } from "@mui/joy";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { ipc } from "#features/base/renderer";
import { ElectronIpc } from "#features/electron/shared";

function useAppTitle() {
    const [title, setTitle] = useState("");
    useEffect(() => {
        ipc.invoke(ElectronIpc.GetAppInfo).then((i) => setTitle(`${i.name} v${i.version}`));
    }, []);
    return title;
}

export function TitleBar() {
    const title = useAppTitle();
    return (
        <Stack direction="row" sx={{ userSelect: "none" }}>
            <Stack
                direction="row"
                flex={1}
                p={1}
                sx={{ appRegion: "drag" }}
            >
                <Typography level="body-xs">{title}</Typography>
            </Stack>
            <Stack direction="row">
                <IconButton color="neutral" onClick={() => ipc.invoke(ElectronIpc.MinimizeWindow)}><MiddleMinimizeIcon /></IconButton>
                <IconButton color="neutral" onClick={() => ipc.invoke(ElectronIpc.ToggleMaximizeWindow)}><CropSquareIcon /></IconButton>
                <IconButton color="danger" onClick={() => ipc.invoke(ElectronIpc.CloseWindow)}><CloseIcon /></IconButton>
            </Stack>
        </Stack>
    )
}

const MiddleMinimizeIcon = () => <SvgIcon focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="MinimizeIcon"><path d="M6 12h12v2H6z"></path></SvgIcon>
