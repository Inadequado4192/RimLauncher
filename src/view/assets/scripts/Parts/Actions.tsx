import { Button, ButtonGroup, Tooltip } from "@mui/joy";
import SteamIcon from "@Icons/Steam";
import RimWorldIcon from "@Icons/RimWorld";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import PagesIcon from "@mui/icons-material/Pages";
import PersonIcon from "@mui/icons-material/Person";
import React from "react";
import UserConfigWindowModal from "../Windows/UserConfigWindowModal";
import { LocalContext } from "@Context/LocalContext";

export default function Actions() {
    const { Localize } = React.useContext(LocalContext);

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
    const { Localize } = React.useContext(LocalContext);
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <UserConfigWindowModal open={open} onClose={() => setOpen(false)} />

            <Button
                onClick={() => setOpen(true)}
                startDecorator={<SettingsIcon />}
            >{Localize("userConfig")}</Button>
        </>
    )
}

function OpenPath() {
    const { Localize } = React.useContext(LocalContext);
    const [isOpen, setOpen] = React.useState(false);

    const [pathes, setPathes] = React.useState<{
        label: string
        path: string
        icon: React.ReactNode
    }[]>([]);

    React.useEffect(() => {
        invoke.getPathes().then(p => {
            setPathes([
                { label: Localize("modPacks"), path: p.ModPacks, icon: <PagesIcon /> },
                { label: Localize("gameConfig"), path: p.RimWorldUser, icon: <SettingsIcon /> },
                { label: Localize("userConfig"), path: p.userConfig, icon: <PersonIcon /> },
                { label: Localize("steam"), path: p.Steam, icon: <SteamIcon /> },
                { label: Localize("game"), path: p.Game, icon: <RimWorldIcon /> },
            ]);
        });
    }, []);

    function PathButtons() {
        return (
            <ButtonGroup orientation="vertical">
                {pathes.map(p =>
                    <Button
                        key={p.path}
                        onClick={() => invoke.openPath(p.path)}
                        startDecorator={p.icon}
                    >{p.label}</Button>
                )}
            </ButtonGroup>
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