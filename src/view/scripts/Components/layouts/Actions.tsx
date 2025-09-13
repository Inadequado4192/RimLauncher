import React from "react";
import { Button, ButtonGroup, Dropdown, IconButton, Link, Menu, MenuButton, Tooltip, Typography } from "@mui/joy";
import RimWorldIcon from "@Renderer/scripts/Components/Icons/RimWorldIcon";
import SteamIcon from "@Renderer/scripts/Components/Icons/SteamIcon";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import PagesIcon from "@mui/icons-material/Pages";
import PersonIcon from "@mui/icons-material/Person";
import BugReportIcon from "@mui/icons-material/BugReport";
import UserConfigWindowModal from "../../Windows/UserConfigWindowModal";
import { UserConfigStore } from "@Stores";
import Localize from "@Common/Localize";
import { StoreCompareType } from "@Stores/store";
import { ActionDialogService } from "@Renderer/scripts/Services/ActionDialog";
import { LoadingService } from "@Renderer/scripts/Services/LoadingService";
import { AlertService } from "@Renderer/scripts/Services/Alert";
import { UpdateCheckResult } from "electron-updater";
import { AlertBigService } from "@Renderer/scripts/Services/AlertBig";
import { ConfirmService } from "@Renderer/scripts/Services/Confirm";
import createBugReportWindow from "@Renderer/scripts/Windows/BugReport/BugReportWindow";
import { openUrl } from "@Renderer/scripts/utils";

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
            <Bug />
            <DevTools />
            <Kofi />
            <OpenPath />
            <UserConfigButton />
            <Button
                color="success"
                startDecorator={<PlayArrowIcon />}
                onClick={() => $invoke.runGame()}
            >{Localize("actions.play")}</Button>
        </ButtonGroup>
    )
}


function CheckUpdates() {
    const [loading, setLoading] = React.useState(true);
    const [message, setMessage] = React.useState(Localize("updates.checkingForUpdates"));
    const [updateCheckResult, setUpdateCheckResult] = React.useState<Awaited<ReturnType<typeof $invoke.checkForUpdatesAndNotify>>>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);

    const openMore = React.useCallback(function (res: UpdateCheckResult) {
        ActionDialogService.create({
            title: res.updateInfo.releaseName,
            body: <span dangerouslySetInnerHTML={{ __html: String(res.updateInfo.releaseNotes) }}></span>,
            fullWidth: true,
            actions: [
                {
                    label: Localize("actions.update"),
                    color: "success",
                    disabled: !isUpdateAvailable,
                    onClick(props) {
                        LoadingService.create({
                            effect(ev) {
                                $send.checkForUpdatesAndNotify()
                                    .onProgress(ev.setProgress)
                                    .onError(ev.onError)
                                    .onSuccess(() => openQuitAndInstall())
                                    .onDone(() => {
                                        ev.close();
                                        props._close();
                                    })
                            },
                        })
                    },
                },
                {
                    label: Localize("actions.close"),
                    color: "neutral",
                    onClick(props) {
                        props._close();
                    },
                }
            ],
        })
    }, [isUpdateAvailable]);

    const openQuitAndInstall = React.useCallback(async () => {
        const restart = await ConfirmService.create({
            title: Localize("windows.updateReady.title"),
            message: Localize("windows.updateReady.message"),
            actionsLabel: { false: Localize("common.later") }
        }).endPromise;

        if (restart) $invoke.quitAndInstallUpdate();
    }, []);

    function onClick() {
        if (updateCheckResult && typeof updateCheckResult !== "string") openMore(updateCheckResult)
    }

    React.useEffect(() => {
        $invoke.checkForUpdatesAndNotify()
            .then(res => {
                if (res === null) {
                    setMessage(Localize("updates.autoUpdateNotSupported"));
                } else {
                    if (!res.isUpdateAvailable) {
                        setMessage(Localize("updates.latestVersion"));
                    } else {
                        setMessage(Localize("updates.updateAvailable"));
                    }

                    if (res) setIsUpdateAvailable(res.isUpdateAvailable);
                }
                setUpdateCheckResult(res);
            })
            .catch(err => {
                setMessage(String(err));
                AlertService.create({
                    message: String(err),
                    lifeTime: 10000,
                    color: "danger",
                });
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);


    return (
        <Button loading={loading} onClick={onClick} color={isUpdateAvailable ? "success" : "neutral"}>
            {message}
        </Button>
    );
}

function Bug() {
    return (
        <Button onClick={() => createBugReportWindow()} color="danger">
            <BugReportIcon />
        </Button>
    )
}

function DevTools() {
    return (
        <Button onClick={() => $invoke.openDevTools()} color="danger">
            DevTools
        </Button>
    )
}
function Kofi() {
    return (
        <Button
            startDecorator={<img src="https://storage.ko-fi.com/cdn/cup-border.png" height={20} width={20} />}
            color="success"
            onClick={openUrl.bind({}, "https://ko-fi.com/C0C01KFX3A")}
        >
            Support Me
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
                <Typography noWrap>{Localize("windows.config.label")}</Typography>
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
                { label: Localize("environment.dirs.modPacks"), path: p.Dir_ModPacks, icon: <PagesIcon /> },
                { label: Localize("environment.dirs.gameConfig"), path: p.Dir_RimWorldUser, icon: <SettingsIcon /> },
                { label: Localize("environment.dirs.userConfig"), path: p.File_UserConfig, icon: <PersonIcon /> },
                ...(userPathes.steamPath ? [{ label: Localize("environment.dirs.steam"), path: userPathes.steamPath, icon: <SteamIcon /> }] : []),
                ...(userPathes.gamePath ? [{ label: Localize("environment.dirs.game"), path: userPathes.gamePath, icon: <RimWorldIcon /> }] : []),
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
            >{Localize("actions.openPaths")}</Button>
        </Tooltip>
    )
}