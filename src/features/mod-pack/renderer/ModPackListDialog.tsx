import { ListItemButton, ModalDialog, DialogTitle, Divider, DialogContent, Table, DialogActions, Button, ModalClose, List, Typography, ListItemContent } from "@mui/joy";
import { ModPack, ModPackIpc, ModPackEntry, ModPackReference } from "../shared";
import { JSX, useEffect, useMemo, useState } from "react";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { localize, useLocalize } from "#features/localization/renderer";
import { ipc } from "#features/base/renderer";
import { Result, PathError } from "#features/base/shared";
import { FullVersion } from "#features/app/shared";
import { createConfirm, createDialog, createPrompt, withLoading } from "#features/overlays/renderer";
import { useGameInfo } from "#features/game-info/renderer";
import { useDerivedMods, useModList } from "#features/mod-core/renderer";
import { useModsConfig } from "#features/mods-config/renderer";
import { getModSourceUrl } from "#features/mod-type/renderer";
import { samePackageId } from "#features/mod-core/shared";
import { Virtuoso } from "react-virtuoso";
import { openUrl } from "#features/system/renderer";

export function ModPackListDialog({ onClose }: {
    onClose: () => void
}) {
    const t = useLocalize();

    const [list, setList] = useState<Result<ModPackEntry, PathError>[]>([]);
    const [selectedPack, setSelectedPack] = useState<ModPackEntry>();

    async function refresh() {
        const d = await ipc.invoke(ModPackIpc.ReadAll);
        setList(d);
        setSelectedPack(m => m && d.find(p => p.success && p.data.fileName === m.fileName)?.data);
    }

    useEffect(() => {
        ipc.invoke(ModPackIpc.ReadAll).then(setList);
    }, []);

    async function onSave() {
        const packName = await createPrompt({ title: localize("common.fields.name") });

        if (!packName) return;

        await withLoading(async () => {
            await ipc.invoke(ModPackIpc.Add, makeModPack(packName, "1.0.0"))
            await refresh();
        });
    }
    async function onUpdate() {
        if (!selectedPack || !await createConfirm("modPacks.confirm.update")) return;

        await withLoading(async () => {
            await ipc.invoke(ModPackIpc.Update, selectedPack.fileName, makeModPack(selectedPack.pack.name, selectedPack.pack.packVersion))
            await refresh();
        });
    }
    async function onUse() {
        const mods = useModList.getState().mods;
        if (!selectedPack || !mods) return;

        const missing: ModPackReference[] = []
        for (const mfp of selectedPack.pack.mods)
            if (!mods.some(m => samePackageId(m, mfp.packageId)))
                missing.push(mfp);

        if (missing.length) {
            const next = createDialog<boolean>(close => <MissingModsDialog selectedPack={selectedPack} defaultMissing={missing} onClose={close} />)
                .then(Boolean);

            if (!next) return;
        }

        await withLoading(ipc.invoke(ModPackIpc.Use, selectedPack.pack));
    }
    async function onRename() {
        if (!selectedPack) return;
        const newName = await createPrompt({ title: localize("common.actions.rename") });
        if (!newName) return;

        await withLoading(async () => {
            await ipc.invoke(ModPackIpc.Rename, selectedPack.fileName, newName);
            await refresh();
        });
    }
    async function onDelete() {
        if (!selectedPack || !await createConfirm("common.confirm.delete")) return;

        await withLoading(async () => {
            await ipc.invoke(ModPackIpc.Delete, selectedPack.fileName);
            await refresh();
        });
    }

    return (
        <ModalDialog minWidth="md">
            <ModalClose onClick={onClose} />
            <DialogTitle>{t("modPacks.title")}</DialogTitle>
            <Divider />
            <DialogContent>
                <Table
                    hoverRow
                    variant="outlined"
                    sx={(t) => ({
                        background: t.palette.background.body,
                    })}
                >
                    <thead>
                        <tr>
                            <th>{t("common.fields.name")}</th>
                            <th>{t("modPacks.modCount")}</th>
                            <th>{t("common.fields.DLC")}</th>
                            <th>{t("mods.details.gameVersion")}</th>
                            <th>{t("modPacks.packVersion")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((info, i) =>
                            info.success
                                ? <ModPackRow key={i} selected={selectedPack === info.data} pack={info.data.pack} onClick={() => setSelectedPack(info.data)} />
                                : <ModPackRow key={i} selected={false} problem={info.error} />
                        )}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<FolderIcon />} onClick={() => ipc.invoke(ModPackIpc.OpenFolder)}>{t("common.actions.open")}</Button>
                <Button startDecorator={<SaveIcon />} onClick={onSave}>{t("common.actions.create")}</Button>
                <Button startDecorator={<DownloadIcon />} disabled>{t("common.actions.import")}</Button>
                <Button startDecorator={<RefreshIcon />} onClick={refresh}>{t("common.actions.refresh")}</Button>
            </DialogActions>
            <DialogActions>
                <Button startDecorator={<InstallDesktopIcon />} onClick={onUse} disabled={!selectedPack} color="success">{t("common.actions.use")}</Button>
                <Button startDecorator={<ArrowCircleUpIcon />} onClick={onUpdate} disabled={!selectedPack}>{t("common.actions.update")}</Button>
                <Button startDecorator={<EditIcon />} onClick={onRename} disabled={!selectedPack}>{t("common.actions.rename")}</Button>
                <Button startDecorator={<DeleteIcon />} onClick={onDelete} disabled={!selectedPack} color="danger">{t("common.actions.delete")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}

function ModPackRow({ selected, onClick, ...data }: {
    selected: boolean,
    onClick?: () => void
} & (
        | { pack: ModPack, problem?: never }
        | { problem: PathError, pack?: never }
    )
) {
    const knownExpansions = useModsConfig(s => s.config?.knownExpansions);

    const expansions = useMemo(() => data.pack?.mods.filter(m => knownExpansions?.includes(m.packageId)).map(m => m.name), [data.pack, knownExpansions]);

    let body: JSX.Element;
    if (data.pack) {
        body = (
            <>
                <td>{data.pack.name}</td>
                <td>{data.pack.mods.length}</td>
                <td>{expansions?.join(", ")}</td>
                <td>{data.pack.gameVersion}</td>
                <td>{data.pack.packVersion}</td>
            </>
        )
    } else {
        body = (
            <>
                <td colSpan={3}>{data.problem.path}</td>
                <td colSpan={2}>{data.problem.message}</td>
            </>
        )
    }

    return (
        <ListItemButton
            selected={selected}
            onClick={onClick}
            component="tr"
            sx={{
                display: "table-row",
                cursor: "pointer"
            }}
        >{body}</ListItemButton>
    )
}

function makeModPack(name: string, packVersion: FullVersion): ModPack {
    const gameVersion = useGameInfo.getState().info?.gameVersionShort;
    if (!gameVersion) throw Error("Wrong data");

    return {
        name, gameVersion, packVersion,
        mods: useDerivedMods.getState().enabledMods.map(m => ({
            name: m.about.name,
            packageId: m.about.packageId,
            sourceUrl: getModSourceUrl(m),
        })),
    };
}




function MissingModsDialog({ defaultMissing, selectedPack, onClose }: {
    defaultMissing: ModPackReference[],
    selectedPack: ModPackEntry,
    onClose: (reason: boolean) => void
}) {
    const t = useLocalize();

    const [missing, setMissing] = useState<ModPackReference[]>(defaultMissing);
    const mods = useModList(s => s.mods);

    useEffect(() => {
        if (!mods) return;
        const newMissing: ModPackReference[] = [];

        for (const mfp of selectedPack.pack.mods)
            if (!mods.some(m => samePackageId(m, mfp.packageId)))
                newMissing.push(mfp);

        if (!newMissing.length) onClose(true);
        else setMissing(newMissing);
    }, [mods]);

    return (
        <ModalDialog>
            <DialogTitle>{t("modPacks.missingMods")}</DialogTitle>
            <DialogContent>
                <List>
                    <Virtuoso
                        data={missing}
                        totalCount={missing.length}
                        style={{ height: "50vh" }}
                        computeItemKey={(_, m) => m.packageId}
                        itemContent={(index, item) => (
                            <ListItemButton
                                onClick={() => item.sourceUrl && openUrl(item.sourceUrl)}
                                disabled={!item.sourceUrl}
                            >
                                <ListItemContent>
                                    <Typography level="title-sm">{item.name}</Typography>
                                    <Typography level="body-sm" noWrap>{item.packageId}</Typography>
                                </ListItemContent>
                            </ListItemButton>
                        )}
                    />
                </List>
            </DialogContent>
            <DialogActions>
                <Button color="success" onClick={() => onClose(true)}>{t("common.actions.continue")}</Button>
                <Button color="danger" onClick={() => onClose(false)}>{t("common.actions.cancel")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}