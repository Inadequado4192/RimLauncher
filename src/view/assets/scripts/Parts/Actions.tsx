import { Button, ButtonGroup, Stack, Tooltip, Typography } from "@mui/joy";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import React from "react";
import { ConfigContext } from "../Context/ConfigContext";
import { Localize } from "../Localize";
import UserConfigWindowModal from "../Windows/UserConfigWindowModal";

export default function Actions() {

    return (
        <>
            <OpenPath />
            <UserConfigButton />
            <Button
                color="success"
                startDecorator={<PlayArrowIcon />}
                onClick={() => invoke.runGame()}
            >{Localize("run")}</Button>
        </>
    )
}


function UserConfigButton() {
    const [open, setOpen] = React.useState(false);
    const { errors } = React.useContext(ConfigContext);

    const isError = (errors && errors.length > 0) || false;

    return (
        <>
            <UserConfigWindowModal open={open} onClose={() => setOpen(false)} />

            <Button
                onClick={() => setOpen(true)}
                color={isError ? "danger" : void 0}
                startDecorator={<SettingsIcon />}
                endDecorator={isError && <Typography color="danger" level="body-xs">Err ({errors?.length})</Typography>}
            >{Localize("userConfig")}</Button>
        </>
    )
}

function OpenPath() {
    const [isOpen, setOpen] = React.useState(false);

    const [pathes, setPathes] = React.useState<{
        label: string
        path: string
    }[]>([]);

    React.useEffect(() => {
        invoke.getPathes().then(p => {
            setPathes([
                { label: "modPacks", path: p.ModPacks },
                { label: "gameConfig", path: p.RimWorldUser },
                { label: "userConfig", path: p.userConfig },
            ]);
        });
    }, []);

    function PathButtons() {
        return (
            <ButtonGroup orientation="vertical">{pathes.map(p => <Button key={p.path} onClick={() => invoke.openPath(p.path)}>{Localize(p.label)}</Button>)}</ButtonGroup>
        )
    }

    return (
        <Tooltip
            variant="plain"
            title={<PathButtons />}
            placement="top"
            arrow
            open={isOpen}
            onClose={(e) => {
                if (e.type !== "blur") setOpen(false);
            }}
            describeChild
        >
            <Button
                startDecorator={<FolderIcon />}
                onClick={() => setOpen(o => !o)}
            >{Localize("open_pathes")}</Button>
        </Tooltip>
    )
}