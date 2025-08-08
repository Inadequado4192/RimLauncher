import { Button, ButtonGroup, Dropdown, Menu, MenuButton, Tooltip } from "@mui/joy";
import RimWorldIcon from "@Components/Icons/RimWorld";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import PagesIcon from "@mui/icons-material/Pages";
import PersonIcon from "@mui/icons-material/Person";
import React from "react";
import UserConfigWindowModal from "../../Windows/UserConfigWindowModal";
import { UserConfigStore } from "@Stores";
import Localize from "@Common/Localize";
import { StoreCompareType } from "@Stores/store";
import { FaSteam } from "react-icons/fa";

export default function Actions() {
    return (
        <ButtonGroup
            sx={{
                "& > button": {
                    "--ButtonGroup-radius": "0px"
                }
            }}
        >
            <Button onClick={() => $invoke.openDevTools()} color="danger">DevTools</Button>
            <OpenPath />
            <UserConfigButton />
            <Button
                color="success"
                startDecorator={<PlayArrowIcon />}
                onClick={() => $invoke.runGame()}
            >{Localize("play")}</Button>
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
    const userPathes: { [K in keyof UserConfig as K extends `${string}Path` ? K : never]: string | null } = {
        gamePath: UserConfigStore.use((uc) => uc.gamePath, StoreCompareType.Primitive),
        steamPath: UserConfigStore.use((uc) => uc.steamPath, StoreCompareType.Primitive),
    }
    const [isOpen, setOpen] = React.useState(false);

    const [pathes, setPathes] = React.useState<{
        label: string
        path: string
        icon: React.ReactNode
    }[]>([]);

    React.useEffect(() => {
        if (!userPathes) return;
        $invoke.getPathes().then(p => {
            setPathes([
                { label: Localize("modPacks"), path: p.Dir_ModPacks, icon: <PagesIcon /> },
                { label: Localize("gameConfig"), path: p.Dir_RimWorldUser, icon: <SettingsIcon /> },
                { label: Localize("userConfig"), path: p.File_UserConfig, icon: <PersonIcon /> },
                ...(userPathes.steamPath ? [{ label: Localize("steamDir"), path: userPathes.steamPath, icon: <FaSteam /> }] : []),
                ...(userPathes.gamePath ? [{ label: Localize("gameDir"), path: userPathes.gamePath, icon: <RimWorldIcon /> }] : []),
            ]);
        });
    }, Object.values(userPathes));

    function PathButtons() {
        return (
            <ButtonGroup orientation="vertical">
                {pathes.map(p =>
                    <Button
                        key={p.path}
                        onClick={() => $invoke.openPath(p.path)}
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