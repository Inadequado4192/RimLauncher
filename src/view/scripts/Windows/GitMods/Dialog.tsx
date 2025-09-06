import { ModalDialog, DialogTitle, Divider, DialogContent, DialogActions, Button, Typography, Table, Stack } from "@mui/joy";
import { PromptService } from "@Services/Prompt";
import DownloadIcon from "@mui/icons-material/Download";
import Localize from "@Common/Localize";
import { GitSpace } from "@Renderer/scripts/Classes/git";
import { z } from "zod";
import React from "react";
import { Mod_Git } from "@Classes/Mod";
import useGitModsNotify, { useGitMods } from "./Notify";
import { LoadingService } from "@Services/LoadingService";

export default function GitModsDialog({ list }: { list: ReturnType<typeof useGitModsNotify>["params"] }) {
    const gitMods = useGitMods();


    async function openPrompt(defaultValue?: string, defaultError?: string) {
        const repoUrl = await PromptService.create({
            text: (
                <>URL
                    <Typography level="body-xs">
                        ({GitSpace.list.map(git => git.repoName).join(" / ")})
                    </Typography>
                </>
            ),
            defaultValue, defaultError,
            onValidate: (val) => z.url().safeParse(val).success || "Wrong URL",
        }).endPromise;

        if (repoUrl) {
            await LoadingService.create({
                async effect(ev) {
                    const info = await GitSpace.getByUrl(repoUrl, true).parseInfo(repoUrl);
                    $send.downloadGitMod(info)
                        .onProgress(ev.setValues)
                        .onError(msg => {
                            openPrompt(repoUrl, msg);
                            ev.close();
                        })
                        .onDone(ev.close)
                }
            })
        }
    }


    const ItemRow = React.useCallback(function ({ mod, canBeUpdated }: {
        mod: Mod_Git
        canBeUpdated: boolean
    }) {

        async function onUpdate() {
            await LoadingService.create({
                async effect(ev) {
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
                {mod.gitinfo.success ? (
                    <>
                        <td><Typography noWrap title={mod.gitinfo.data.info.repoUrl}>{mod.gitinfo.data.info.repoUrl}</Typography></td>
                        <td>{new Date(mod.gitinfo.data.lastUpdate).toLocaleString()}</td>
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
                                <Button size="sm" onClick={() => onUpdate()} color={canBeUpdated ? "success" : "neutral"} >{Localize("actions.update")}</Button>
                                <Button size="sm" onClick={() => mod.openInGit()}>{Localize("actions.openInGit")}</Button>
                                <Button size="sm" onClick={() => mod.openDir()}>{Localize("actions.openDirectory")}</Button>
                            </Stack>
                        </td>
                    </>
                ) : (
                    <>
                        <td colSpan={1} title={mod.gitinfo.error.dirPath}>
                            <Typography noWrap>{mod.gitinfo.error.dirPath}</Typography>
                        </td>
                        <td colSpan={2}>{mod.gitinfo.error.message}</td>
                    </>
                )}
            </tr>
        )
    }, []);


    return (
        <ModalDialog minWidth="md">
            <DialogTitle>Git</DialogTitle>
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
                            <th>{Localize("common.name")}</th>
                            <th>{Localize("common.url")}</th>
                            <th>{Localize("common.lastUpdate")}</th>
                            <th>{Localize("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gitMods.map(m => <ItemRow key={m.dirPath} mod={m} canBeUpdated={!!list?.find(lm => lm.mod.dirPath === m.dirPath)?.canBeUpdate} />)}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<DownloadIcon />} onClick={() => openPrompt()}>{Localize("actions.add")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}