import { ListItemButton, ModalDialog, DialogTitle, Divider, DialogContent, Table, DialogActions, Button } from "@mui/joy";
import { ConfirmService } from "@Services/Confirm";
import { PromptData, PromptService } from "@Services/Prompt";
import React from "react";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import DeleteIcon from "@mui/icons-material/Delete";
import Localize from "@Common/Localize";
import { AlertService } from "@Renderer/scripts/Services/Alert";

export default function ModPackListWindowDialog() {
    const [list, setList] = React.useState<Result<ModPackInfo, ProblemByPath>[]>([]);
    const [selectedPack, setSelectedPack] = React.useState<ModPackInfo>();
    const [selectedPath, setSelectedPath] = React.useState<string>();

    React.useEffect(() => {
        $invoke.getModPacksList().then(setList);

        const onDirChange: on_listenerType<typeof $on.ModPacks_Changed> = (e, list) => {
            setList(list);
        }

        $on.ModPacks_Changed(onDirChange);
        return () => {
            $off.ModPacks_Changed(onDirChange);
        }
    }, []);

    const onValidateNames: PromptData["onValidate"] = (value) => {
        if (list.some(i => i.success && i.data.name.toLowerCase() == value.toLowerCase())) {
            return Localize("common.validation.thisNameAlreadyUsed")
        } else return true;
    }

    const ItemRow = React.useCallback(function ItemRow({ selected, info }: {
        selected: boolean
        info: ModPackInfo
    }) {
        return (
            <ListItemButton
                selected={selected}
                onClick={() => {
                    setSelectedPack(info);
                    setSelectedPath(info.dirPath);
                }}
                component="tr"
                sx={{
                    display: "table-row",
                    cursor: "pointer"
                }}
            >
                <td>{info.name}</td>
                <td>{info.modCount}</td>
                <td>{info.DLC.join(" ")}</td>
                <td>{info.version}</td>
            </ListItemButton>
        )
    }, []);
    const ErrorItemRow = React.useCallback(function ItemRow({ problem, selected }: {
        selected: boolean
        problem: ProblemByPath
    }) {
        return (
            <ListItemButton
                selected={selected}
                onClick={() => {
                    setSelectedPack(undefined);
                    setSelectedPath(problem.dirPath);
                }}
                component="tr"
                sx={{
                    display: "table-row",
                    cursor: "pointer"
                }}
            >
                <td colSpan={2}>{problem.dirPath}</td>
                <td colSpan={2}>{problem.message}</td>
            </ListItemButton>
        )
    }, []);

    async function onSave() {
        const result = await PromptService.create({
            text: Localize("common.name"),
            onValidate: onValidateNames,
        }).endPromise;

        if (result) $invoke.saveModPack(result);
    }
    async function onUpdate() {
        if (!selectedPack || !await ConfirmService.create({ message: Localize("confirm.updationModpack") }).endPromise) return;
        if (!selectedPack) return;
        $invoke.saveModPack(selectedPack.name);
    }
    async function onUse() {
        if (!selectedPack) return;
        $invoke.useModPack(selectedPack.name);
    }
    async function onRename() {
        if (!selectedPack) return;
        const result = await PromptService.create({
            text: Localize("actions.rename"),
            onValidate: onValidateNames,
        }).endPromise;
        if (result) $invoke.renameModPack(selectedPack.name, result);
    }
    async function onDelete() {
        if (!selectedPack || !await ConfirmService.create({ message: Localize("confirm.deletionModpack") }).endPromise) return;

        await $invoke.deleteModPack(selectedPack.name);
    }

    return (
        <ModalDialog minWidth="md">
            <DialogTitle>{Localize("mods.modPacks")}</DialogTitle>
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
                            <th>{Localize("common.name")}</th>
                            <th>{Localize("common.countOfMods")}</th>
                            <th>{Localize("common.DLC")}</th>
                            <th>{Localize("common.gameVersion")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((info, i) =>
                            info.success
                                ? <ItemRow key={info.data.dirPath} selected={info.data.dirPath == selectedPath} info={info.data} />
                                : <ErrorItemRow key={i} selected={info.error.dirPath == selectedPath} problem={info.error} />
                        )}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<FolderIcon />} onClick={async () => $invoke.openPath((await $invoke.getPathes()).Dir_ModPacks)}>{Localize("actions.openDirectory")}</Button>
                <Button startDecorator={<SaveIcon />} onClick={onSave}>{Localize("actions.save")}</Button>
                <Button startDecorator={<DownloadIcon />} onClick={async () => { }} disabled>{Localize("actions.import")}</Button>
            </DialogActions>
            <DialogActions>
                <Button startDecorator={<InstallDesktopIcon />} onClick={onUse} disabled={!selectedPack} color="success">{Localize("actions.use")}</Button>
                <Button startDecorator={<ArrowCircleUpIcon />} onClick={onUpdate} disabled={!selectedPack}>{Localize("actions.update")}</Button>
                <Button startDecorator={<EditIcon />} onClick={onRename} disabled={!selectedPack}>{Localize("actions.rename")}</Button>
                <Button startDecorator={<DeleteIcon />} onClick={onDelete} disabled={!selectedPack} color="danger">{Localize("actions.delete")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}