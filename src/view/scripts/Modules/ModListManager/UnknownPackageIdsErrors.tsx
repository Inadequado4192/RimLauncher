import { Button, List, ListItem, ListItemButton, Stack, Typography } from "@mui/joy";
import { ConfirmService } from "@Renderer/scripts/Services/Confirm";
import React from "react";
import { __ModListStores__ } from "./__ModListStore__";
import Localize from "@Common/Localize";
import { ModsConfigStore } from "@Renderer/scripts/Stores";
import { ActionDialogService } from "@Renderer/scripts/Services/ActionDialog";

export default function UnknownPackageIdsErrors() {
    const unknownPackageIds = __ModListStores__.unknownPackageIds.use();

    const deletePackageId = React.useCallback(async (pid: PackageId) => {
        const cnf = await ConfirmService.create({
            title: Localize("windows.unknownPackageIds.deletePackageId.title"),
            message: Localize("windows.unknownPackageIds.deletePackageId.message", [pid]),
        }).endPromise;
        if (cnf) $invoke.disableMod(pid);
    }, []);
    
    const deleteAllUnknownPackageId = React.useCallback(async () => {
        const unknownPackageIds = __ModListStores__.unknownPackageIds.get();
        const activeMods = ModsConfigStore.get();
        $invoke.setActiveMods(activeMods.activeMods.filter(pid => !unknownPackageIds.includes(pid)))
    }, []);

    const onClick = React.useCallback(function onClick() {
        const { id } = ActionDialogService.create({
            title: Localize("windows.unknownPackageIds.title"),
            body: () => {
                const unknownPackageIds = __ModListStores__.unknownPackageIds.use();

                React.useEffect(() => {
                    if (unknownPackageIds.length <= 0) ActionDialogService.remove(id);
                }, [unknownPackageIds]);

                return (
                    <List>
                        <Typography mb={1}>{Localize("windows.unknownPackageIds.message")}</Typography>
                        {unknownPackageIds.map((pid, i) => (
                            <ListItem key={i}>
                                <ListItemButton
                                    title={pid}
                                    onClick={deletePackageId.bind({}, pid)}
                                >
                                    <Stack>
                                        <Typography sx={{ whiteSpace: "break-spaces" }}>{pid}</Typography>
                                    </Stack>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )
            },
            actions: [
                {
                    label: Localize("actions.close"),
                    onClick: (props) => props._close(),
                },
                {
                    label: Localize("actions.removeAll"),
                    onClick: deleteAllUnknownPackageId,
                },
            ]
        });
    }, []);

    if (unknownPackageIds.length <= 0) return null;

    return <Button color="warning" onClick={onClick}>{Localize("windows.unknownPackageIds.button", [unknownPackageIds.length])}</Button>;
}