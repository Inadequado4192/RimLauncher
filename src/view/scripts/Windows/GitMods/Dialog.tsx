import { ModalDialog, DialogTitle, Divider, DialogContent, DialogActions, Button, Typography, Table, Stack } from "@mui/joy";
import { PromptService } from "@Services/Prompt";
import DownloadIcon from "@mui/icons-material/Download";
import Localize from "@Common/Localize";
import { GitSpace } from "@Common/libs/git";
import { z } from "zod";
import React from "react";
import { Mod_Git } from "@Classes/Mod";
import { openUrl } from "../../utils";
import useGitModsNotify, { useGitMods } from "./Notify";
import { LoadingService } from "@Services/LoadingService";
import { AlertService } from "@Services/Alert";

export default function GitModsDialog({ list }: { list: ReturnType<typeof useGitModsNotify>["params"] }) {
    const gitMods = useGitMods();


    async function openPrompt(defaultValue?: string, defaultError?: string) {
        const resultUrl = await PromptService.create({
            text: (
                <>URL
                    <Typography level="body-xs">
                        ({GitSpace.list.map(git => git.name).join(" / ")})
                    </Typography>
                </>
            ),
            defaultValue, defaultError,
            onValidate: (val) => z.url().safeParse(val).success || "Wrong URL",
        }).endPromise;

        if (resultUrl) {
            await LoadingService.create({
                effect: (ev) => $send.downloadGitMod(resultUrl)
                    .onProgress(ev.setValues)
                    .onError(msg => {
                        openPrompt(resultUrl, msg);
                        ev.close();
                    })
                    .onDone(ev.close)
            })
        }
    }


    const ItemRow = React.useCallback(function ({ mod, canBeUpdated }: {
        mod: Mod_Git
        canBeUpdated: boolean
    }) {

        async function onUpdate() {
            await LoadingService.create({
                effect(ev) {
                    $send.updateGitMod(mod.dirPath)
                        .onProgress(ev.setValues)
                        .onError(ev.onError)
                        .onDone(ev.close)
                },
            }).endPromise;
        }

        return (
            <tr>
                <td>{mod.about.name}</td>
                {mod.gitinfo ? (
                    <>
                        <td><Typography noWrap title={mod.gitinfo.url}>{mod.gitinfo.url}</Typography></td>
                        <td>{new Date(mod.gitinfo.lastUpdate).toLocaleString()}</td>
                        <td>
                            <Stack
                                direction="row"
                                flexWrap="wrap"
                                spacing={1}
                                useFlexGap
                                sx={{
                                    "button": {
                                        flexGrow: 1,
                                    }
                                }}
                            >
                                <Button size="sm" onClick={() => onUpdate()} color={canBeUpdated ? "success" : "neutral"} >{Localize("update")}</Button>
                                <Button size="sm" onClick={() => mod.openInGit()}>{Localize("openInGit")}</Button>
                                <Button size="sm" onClick={() => mod.openDir()}>{Localize("openDirectory")}</Button>
                            </Stack>
                        </td>
                    </>
                ) : <td colSpan={3}>{Localize("error")}</td>}
            </tr>
        )
    }, []);


    return (
        <ModalDialog minWidth="md">
            <DialogTitle>{Localize("git")}</DialogTitle>
            <Divider />
            <DialogContent>
                <Table
                    variant="outlined"
                    sx={(t) => ({
                        background: t.palette.background.body,
                    })}
                >
                    <thead>
                        <tr>
                            <th>{Localize("name")}</th>
                            <th>{Localize("url")}</th>
                            <th>{Localize("lastUpdate")}</th>
                            <th>{Localize("actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gitMods.map(m => <ItemRow key={m.dirPath} mod={m} canBeUpdated={!!list?.find(lm => lm.mod.dirPath === m.dirPath)?.canBeUpdate} />)}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<DownloadIcon />} onClick={() => openPrompt()}>{Localize("add")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}