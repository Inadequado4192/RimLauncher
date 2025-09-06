import { Button, List, ListItem, ListItemButton, Stack, Typography } from "@mui/joy";
import { AlertBigService } from "@Services/AlertBig";
import React from "react";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import Localize from "@Common/Localize";

export default function LoadingErrors() {
    const loadingErrors = __GlobalStores__.loadingErrors.use();

    const onClick = React.useCallback(function onClick() {
        AlertBigService.create({
            title: "Loading Errors",
            message: (
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

    return loadingErrors.length > 0 && <Button color="danger" onClick={onClick}>{Localize("errors.loadingErrors", [loadingErrors.length])}</Button>;
}