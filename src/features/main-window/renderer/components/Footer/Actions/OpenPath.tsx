import { useEffect, useState } from "react";
import { Button, ButtonGroup, Tooltip } from "@mui/joy";
import FolderIcon from "@mui/icons-material/Folder";
import { useLocalize } from "#features/localization/renderer";
import { PublicPath, PublicPathsIpc } from "#features/public-paths/shared";
import { ipc } from "#features/base/renderer";
import { SystemIpc } from "#features/system/shared";


export function OpenPath() {
    const t = useLocalize();
    // const userPathes: { [K in keyof UserConfig as K extends `${string}Path` ? K : never]: string | null } = {
    //     gamePath: UserConfigStore.use((uc) => uc.gamePath, StoreCompareType.Primitive),
    //     steamPath: UserConfigStore.use((uc) => uc.steamPath, StoreCompareType.Primitive),
    // }
    const [isOpen, setOpen] = useState(false);

    const [pathes, setPathes] = useState<PublicPath[]>([]);

    useEffect(() => {
        ipc.invoke(PublicPathsIpc.Get).then(setPathes);
        //     if (!userPathes) return;
        //     $invoke.getPathes().then(p => {
        //         setPathes([
        //             { label: Localize("environment.dirs.modPacks"), path: p.Dir_ModPacks, icon: <PagesIcon /> },
        //             { label: Localize("environment.dirs.gameConfig"), path: p.Dir_RimWorldUser, icon: <SettingsIcon /> },
        //             { label: Localize("environment.dirs.userConfig"), path: p.File_UserConfig, icon: <PersonIcon /> },
        //             ...(userPathes.steamPath ? [{ label: Localize("environment.dirs.steam"), path: userPathes.steamPath, icon: <SteamIcon /> }] : []),
        //             ...(userPathes.gamePath ? [{ label: Localize("environment.dirs.game"), path: userPathes.gamePath, icon: <RimWorldIcon /> }] : []),
        //         ]);
        //     });
    }, []);


    return (
        <Tooltip
            variant="plain"
            title={
                <ButtonGroup orientation="vertical">
                    {pathes.map(p =>
                        <Button
                            key={p.path}
                            onClick={() => ipc.invoke(SystemIpc.OpenPath, p.path)}
                            // startDecorator={p.icon}
                        >{t(p.label)}</Button>
                    )}
                </ButtonGroup>
            }
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
            >{t("mainWindow.directories.openMenu")}</Button>
        </Tooltip>
    )
}