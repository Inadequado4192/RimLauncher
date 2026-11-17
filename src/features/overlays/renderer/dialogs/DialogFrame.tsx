import { ReactNode } from "react";
import { DialogActions, DialogContent, DialogTitle, ModalDialog, ModalDialogProps } from "@mui/joy";

interface DialogFrameProps extends Omit<ModalDialogProps, "title"> {
    title?: ReactNode;
    actions?: ReactNode;
}

export function DialogFrame({ title, actions, children, ...rest }: DialogFrameProps) {
    return (
        <ModalDialog {...rest}>
            {title && <DialogTitle>{title}</DialogTitle>}
            <DialogContent>{children}</DialogContent>
            {actions && <DialogActions>{actions}</DialogActions>}
        </ModalDialog>
    );
}