import { ModListStore } from "@Context/ModListContext";
import { Button, List, ListItem, ListItemButton, Stack, Typography } from "@mui/joy";
import { AlertService } from "@Services/Alert";
import { AlertBigService } from "@Services/AlertBig";
import React from "react";

export default function LoadingErrors() {
    const loadingErrors = ModListStore.loadingErrors.use();

    const onClick = React.useCallback(function onClick() {
        AlertBigService.create({
            title: "Loading Errors",
            text: (
                <List>
                    {loadingErrors.map((w, i) => (
                        <ListItem key={i}>
                            <ListItemButton
                                title={w.dirPath}
                                onClick={() => $invoke.openPath(w.dirPath)}
                            >
                                <Stack>
                                    <Typography sx={{ whiteSpace: "break-spaces" }}>{w.message}</Typography>
                                    <Typography noWrap level="body-xs">{w.dirPath}</Typography>
                                </Stack>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            ),
        });
    }, [loadingErrors]);

    return loadingErrors.length > 0 && <Button color="danger" onClick={onClick}>Loading Errors: {loadingErrors.length}</Button>;
}