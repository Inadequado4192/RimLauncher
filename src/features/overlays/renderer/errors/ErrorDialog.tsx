import { useLocalize } from "#features/localization/renderer";
import { ModalDialog, DialogTitle, DialogContent, Typography, Link, Sheet, DialogActions, Button } from "@mui/joy";
import { useState } from "react";
import { createDialog } from "../dialogs";
import { describeError } from "./describeError";
import { Result } from "#features/base/shared";

function ErrorDialog({ err, onClose }: { err: unknown; onClose: () => void }) {
    const t = useLocalize();
    const [open, setOpen] = useState(false);

    const { text, details } = describeError(err);

    return (
        <ModalDialog variant="outlined" color="danger" role="alertdialog">
            <DialogTitle>{t("common.status.error")}</DialogTitle>
            <DialogContent>
                <Typography>{text ? t(text) : t("common.errors.unexpected")}</Typography>

                {details && (
                    <>
                        <Link onClick={() => setOpen((v) => !v)}>{t("common.fields.details")}</Link>
                        {open && (
                            <Sheet variant="soft" sx={{ p: 1, overflow: "auto", maxHeight: 200 }}>
                                <code style={{ whiteSpace: "pre-wrap" }}>{details}</code>
                            </Sheet>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("common.actions.close")}</Button>
            </DialogActions>
        </ModalDialog>
    );
}




export const showError = (err: unknown): Promise<void> => {
    return createDialog<void>((close) => <ErrorDialog err={err} onClose={close} />).then(() => { });
};

export async function unwrap<T, E>(promise: Promise<Result<T, E>>): Promise<T | undefined> {
    try {
        const r = await promise;
        if (r.success) return r.data;
        await showError(r.error);
    } catch (e) {
        await showError(e);
    }
    return undefined;
}