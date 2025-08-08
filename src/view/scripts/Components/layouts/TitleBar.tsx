import { IconButton, Stack, Typography } from "@mui/joy";
import React from "react";
import { IoClose } from "react-icons/io5";
import { MdCropSquare } from "react-icons/md";
import { VscChromeMinimize } from "react-icons/vsc";


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
            <Stack
                direction="row"
                sx={{
                    "& button": {
                        borderRadius: 0
                    }
                }}
            >
                {/* <IconButton color="success" onClick={() => invoke.reload()}><ReplayIcon /></IconButton> */}
                <IconButton color="neutral" onClick={() => $invoke.winMinimize()}><VscChromeMinimize /></IconButton>
                <IconButton color="neutral" onClick={() => $invoke.winToggleMaximize()}><MdCropSquare /></IconButton>
                <IconButton color="danger" onClick={() => $invoke.winClose()}><IoClose /></IconButton>
            </Stack>
        </Stack>
    )
}