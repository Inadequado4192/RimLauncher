import { useLocalize } from "#features/localization/renderer";
import { LocalizedString } from "#features/localization/shared";
import { ModalDialog, DialogTitle, DialogActions, Button, DialogContent } from "@mui/joy";
import { createDialog } from "../dialogStore";

interface ConfirmOptions {
    message: LocalizedString;
    title?: LocalizedString;
    confirmLabel?: LocalizedString;
    cancelLabel?: LocalizedString;
    color?: "danger" | "primary";
}

function ConfirmDialog({ title, message, confirmLabel, cancelLabel, color = "danger", onClose }: ConfirmOptions & {
    onClose: (result: boolean) => void;
}) {
    const t = useLocalize();

    return (
        <ModalDialog variant="outlined" role="alertdialog">
            {title && <DialogTitle>{t(title)}</DialogTitle>}
            <DialogContent>{t(message)}</DialogContent>
            <DialogActions>
                <Button color={color} onClick={() => onClose(true)}>
                    {t(confirmLabel ?? "common.answers.yes")}
                </Button>
                <Button variant="plain" onClick={() => onClose(false)}>
                    {t(cancelLabel ?? "common.answers.no")}
                </Button>
            </DialogActions>
        </ModalDialog>
    );
}

export function createConfirm(options: ConfirmOptions): Promise<boolean>;
export function createConfirm(message: ConfirmOptions["message"]): Promise<boolean>;
export function createConfirm(options: ConfirmOptions | ConfirmOptions["message"]) {
    const o: ConfirmOptions = typeof options === "string" || "key" in options ? { message: options } : options;
    return createDialog<boolean>((close) => <ConfirmDialog {...o} onClose={close} />).then(Boolean);
};