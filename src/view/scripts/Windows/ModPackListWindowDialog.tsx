import { ListItemButton, ModalDialog, DialogTitle, Divider, DialogContent, Table, DialogActions, Button } from "@mui/joy";
import { ConfirmService } from "src/view/scripts/Services/Confirm";
import { PromptData, PromptService } from "src/view/scripts/Services/Prompt";
import React from "react";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import EditIcon from "@mui/icons-material/Edit";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import DeleteIcon from "@mui/icons-material/Delete";
import Localize from "@Common/Localize";

export default function ModPackListWindowDialog() {
    const [list, setList] = React.useState<ModPackInfo[]>([]);
    const [selectedPack, setSelectedPack] = React.useState<ModPackInfo>();

    React.useEffect(() => {
        invoke.getModPacksList().then(res => setList(res));

        const onDirChange: on_listenerType<typeof on.changeModPacksList> = (e, list) => {
            setList(list);
        }

        on.changeModPacksList(onDirChange);
        return () => {
            off.changeModPacksList(onDirChange);
        }
    }, []);

    const onValidateNames: PromptData["onValidate"] = (value) => {
        if (list.some(i => i.name.toLowerCase() == value.toLowerCase())) {
            return {
                severity: "danger",
                text: Localize("thisNameAlreadyUsed")
            }
        } else return undefined;
    }

    const ItemRow = React.useCallback(function ({ selected, info }: {
        selected: boolean
        info: ModPackInfo
    }) {
        return (
            <ListItemButton
                selected={selected}
                onClick={() => setSelectedPack(info)}
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

    async function onSave() {
        const result = await PromptService.create({
            text: Localize("modPackName"),
            onValidate: onValidateNames,
        });

        if (result) invoke.saveModPack(result);
    }
    async function onUpdate() {
        if (!selectedPack || !await ConfirmService.create({ text: Localize("confirmUpdationModpack") })) return;
        if (!selectedPack) return;
        invoke.saveModPack(selectedPack.name);
    }
    async function onUse() {
        if (!selectedPack) return;
        invoke.useModPack(selectedPack.name);
    }
    async function onRename() {
        if (!selectedPack) return;
        const result = await PromptService.create({
            text: Localize("renameModPack"),
            onValidate: onValidateNames,
        });
        if (result) invoke.renameModPack(selectedPack.name, result);
    }
    async function onDelete() {
        if (!selectedPack || !await ConfirmService.create({ text: Localize("confirmDeletionModpack") })) return;

        await invoke.deleteModPack(selectedPack.name);
    }

    return (
        <ModalDialog minWidth="md">
            <DialogTitle>{Localize("modPacks")}</DialogTitle>
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
                            <th>{Localize("modPacks_Table_Name")}</th>
                            <th>{Localize("modPacks_Table_Count")}</th>
                            <th>{Localize("modPacks_Table_DLC")}</th>
                            <th>{Localize("modPacks_Table_GameVersion")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map(info => <ItemRow key={info.path} selected={info.name == selectedPack?.name} info={info} />)}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<FolderIcon />} onClick={async () => invoke.openPath((await invoke.getPathes()).ModPacks)}>{Localize("openDirectory")}</Button>
                <Button startDecorator={<SaveIcon />} onClick={onSave}>{Localize("save")}</Button>
                <Button startDecorator={<DownloadIcon />} onClick={async () => { }} disabled>{Localize("import")}</Button>
            </DialogActions>
            <DialogActions>
                <Button startDecorator={<InstallDesktopIcon />} onClick={onUse} disabled={!selectedPack} color="success">{Localize("use")}</Button>
                <Button startDecorator={<ArrowCircleUpIcon />} onClick={onUpdate} disabled={!selectedPack}>{Localize("update")}</Button>
                <Button startDecorator={<EditIcon />} onClick={onRename} disabled={!selectedPack}>{Localize("rename")}</Button>
                <Button startDecorator={<DeleteIcon />} onClick={onDelete} disabled={!selectedPack} color="danger">{Localize("delete")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}