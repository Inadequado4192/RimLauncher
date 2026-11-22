import { AppIpc, CheckForUpdatesResult } from "#features/app/shared";
import { ipc } from "#features/base/renderer";
import { localize, useLocalize } from "#features/localization/renderer";
import { createBackgroundTask, createConfirm, createDialog } from "#features/overlays/renderer";
import { Box, Button, DialogActions, DialogContent, DialogTitle, Link, ModalDialog } from "@mui/joy";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

export function CheckAppUpdates() {
    const [loading, setLoading] = useState(true);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [message, setMessage] = useState(localize("appUpdates.checking"));
    const [updateCheckResult, setUpdateCheckResult] = useState<CheckForUpdatesResult | null>(null);



    function onClick() {
        if (updateCheckResult) createDialog(<MoreAboutVersionDialog updateCheckResult={updateCheckResult} />);
    }

    useEffect(() => {
        ipc.invoke(AppIpc.CheckForUpdates)
            .then(res => {
                if (res === null) {
                    setMessage(localize("appUpdates.autoUpdateNotSupported"));
                } else {
                    if (!res.isUpdateAvailable) {
                        setMessage(localize("appUpdates.latestVersion"));
                    } else {
                        setMessage(localize("appUpdates.available"));
                        setIsUpdateAvailable(true);
                    }
                }

                setUpdateCheckResult(res);
            })
            .catch(err => {
                setMessage(localize("common.status.error"));
                createBackgroundTask.error(localize("appUpdates.checking"), err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);


    return (
        <Button
            loading={loading}
            onClick={onClick}
            color={isUpdateAvailable ? "success" : "neutral"}
        >
            {message}
        </Button >
    );
}


function MoreAboutVersionDialog({ updateCheckResult }: { updateCheckResult: CheckForUpdatesResult }) {
    const t = useLocalize();
    const releaseNotes = updateCheckResult.updateInfo.releaseNotes;
    const markdown = typeof releaseNotes === "string"
        ? releaseNotes
        : releaseNotes?.map(note => note.note).filter(Boolean).join("\n\n") ?? "";
    const releaseNotesHtml = DOMPurify.sanitize(marked.parse(markdown, { async: false }) as string);


    return (
        <ModalDialog size="sm">
            <DialogTitle>{updateCheckResult.updateInfo.releaseName}</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        whiteSpace: "normal",
                        "& h1, & h2, & h3, & h4, & h5, & h6, & p": {
                            my: 1
                        },
                        "& a": {
                            color: "var(--joy-palette-text-primary)"
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: releaseNotesHtml }}
                />
                <Link href="https://github.com/Inadequado4192/RimLauncher/blob/main/CHANGELOG.md">CHANGELOG</Link>
            </DialogContent>
            <DialogActions>
                <Button
                    color="success"
                    disabled={!updateCheckResult.isUpdateAvailable}
                    onClick={async () => {
                        ipc.invoke(AppIpc.DownloadUpdate);
                        const task = createBackgroundTask({ title: localize("common.status.downloading") });

                        const u = ipc.on(AppIpc.ProgressEvent, async e => {
                            switch (e.type) {
                                case "progress":
                                    task.update({ percent: e.percent, details: e.details ? localize(e.details) : null })
                                    break;
                                case "error":
                                    u();
                                    task.error(e.error);
                                    break;
                                case "done":
                                    u();
                                    task.done();

                                    if (
                                        await createConfirm({
                                            title: "appUpdates.ready.title",
                                            message: "appUpdates.ready.message",
                                            cancelLabel: "common.actions.later"
                                        })
                                    ) ipc.invoke(AppIpc.QuitAndInstall);
                                    break;
                            }
                        });
                    }}
                >
                    {t("common.actions.update")}
                </Button>
            </DialogActions>
        </ModalDialog>
    )
}