import { Button, ButtonGroup, Dropdown, Menu, MenuButton, Tooltip } from "@mui/joy";
import SteamIcon from "src/view/scripts/Components/Icons/Steam";
import RimWorldIcon from "src/view/scripts/Components/Icons/RimWorld";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import PagesIcon from "@mui/icons-material/Pages";
import PersonIcon from "@mui/icons-material/Person";
import React from "react";
import UserConfigWindowModal from "../../Windows/UserConfigWindowModal";
import { ConfigContext } from "src/view/scripts/Context/ConfigContext";
import Localize from "@common/Localize";

export default function Actions() {
    return (
        <ButtonGroup
            sx={{
                "& > button": {
                    "--ButtonGroup-radius": "0px"
                }
            }}
        >
            <OpenPath />
            <UserConfigButton />
            <Button
                color="success"
                startDecorator={<PlayArrowIcon />}
                onClick={() => invoke.runGame()}
            >{Localize("run")}</Button>
        </ButtonGroup>
    )
}


function UserConfigButton() {
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
    const { config } = React.useContext(ConfigContext);
    const [isOpen, setOpen] = React.useState(false);

    const [pathes, setPathes] = React.useState<{
        label: string
        path: string
        icon: React.ReactNode
    }[]>([]);

    React.useEffect(() => {
        if (!config) return;
        invoke.getPathes().then(p => {
            setPathes([
                { label: Localize("modPacks"), path: p.ModPacks, icon: <PagesIcon /> },
                { label: Localize("gameConfig"), path: p.RimWorldUser, icon: <SettingsIcon /> },
                { label: Localize("userConfig"), path: p.UserConfig, icon: <PersonIcon /> },
                ...(config.steamPath ? [{ label: Localize("steam"), path: config.steamPath, icon: <SteamIcon /> }] : []),
                ...(config.gamePath ? [{ label: Localize("game"), path: config.gamePath, icon: <RimWorldIcon /> }] : []),
            ]);
        });
    }, [config]);

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
            >{Localize("open_paths")}</Button>
        </Tooltip>
    )
}