import { Button, ButtonGroup, Dropdown, Menu, MenuButton, Tooltip, Typography } from "@mui/joy";
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
import { ActionDialogService } from "@Renderer/scripts/Services/ActionDialog";
import { LoadingService } from "@Renderer/scripts/Services/LoadingService";
import { AlertService } from "@Renderer/scripts/Services/Alert";
import { UpdateCheckResult } from "electron-updater";

export default function Actions() {
    return (
        <ButtonGroup
            sx={{
                "& > button": {
                    "--ButtonGroup-radius": "0px",
                    borderRight: "none !important",
                    borderBottom: "none !important",
                    "&:not(:first-of-type)": {
                        borderLeft: "none !important",
                    },
                }
            }}
        >
            <CheckUpdates />
            <DevTools />
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

function CheckUpdates() {
    const [loading, setLoading] = React.useState(true);
    const [message, setMessage] = React.useState(Localize("checkingForUpdates"));
    const [updateCheckResult, setUpdateCheckResult] = React.useState<Awaited<ReturnType<typeof $invoke.checkForUpdatesAndNotify>>>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);

    const openMore = React.useCallback(function (res: UpdateCheckResult) {
        ActionDialogService.create({
            title: res.updateInfo.releaseName,
            text: <span dangerouslySetInnerHTML={{ __html: String(res.updateInfo.releaseNotes) }}></span>,
            fullWidth: true,
            actions: [
                {
                    label: Localize("update"),
                    color: "success",
                    disabled: !isUpdateAvailable,
                    onClick(props) {
                        LoadingService.create({
                            effect(ev) {
                                $send.checkForUpdatesAndNotify()
                                    .onProgress(ev.setProgress)
                                    .onError(ev.onError)
                                    .onDone(() => {
                                        ev.close();
                                        props._close();
                                    })
                            },
                        })
                    },
                },
                {
                    label: Localize("close"),
                    color: "neutral",
                    onClick(props) {
                        props._close();
                    },
                }
            ],
        })
    }, [isUpdateAvailable]);

    React.useEffect(() => {
        $invoke.checkForUpdatesAndNotify()
            .then(res => {
                if (res === "NotSupported") {
                    setMessage(Localize("autoUpdateNotSupported"));
                } else {
                    if (!res?.isUpdateAvailable) {
                        setMessage(Localize("latestVersion"));
                    } else {
                        setMessage(Localize("updateAvailable"));
                    }

                    if (res) setIsUpdateAvailable(res.isUpdateAvailable);
                }
                setUpdateCheckResult(res);
            })
            .catch(err => {
                setMessage(String(err));
                AlertService.create({
                    text: String(err),
                    lifeTime: 10000,
                    color: "danger",
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    function onClick() {
        if (updateCheckResult && typeof updateCheckResult !== "string") openMore(updateCheckResult)
    }

    return (
        <Button loading={loading} onClick={onClick}>
            {message}
        </Button>
    );
}
function DevTools() {
    return (
        <Button onClick={() => $invoke.openDevTools()} color="danger">
            DevTools
        </Button>
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
            >
                <Typography noWrap>{Localize("config")}</Typography>
            </Button>
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