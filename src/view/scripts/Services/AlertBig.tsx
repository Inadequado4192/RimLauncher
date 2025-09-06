"use client";
import { Button, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions, ModalDialogProps } from "@mui/joy";
import React from "react";
import Localize from "@Common/Localize";
import { createService } from "./BaseService";

interface AlertBigData {
    title?: (() => React.ReactNode) | React.ReactNode,
    message: (() => React.ReactNode) | React.ReactNode,
    modal?: {
        dontCloseOnBackdropClick?: boolean
    }
    dialogProps?: ModalDialogProps;
}

export const {
    Service: AlertBigService,
} = createService<AlertBigData>({
    element(props) {
        function onNext() {
            props._close();
        }

        React.useEffect(() => {
            function onKeyUp(e: KeyboardEvent) {
                if (e.code == "Enter" || e.code == "Escape") onNext();
            }
            addEventListener("keyup", onKeyUp);
            return () => removeEventListener("keyup", onKeyUp);
        }, []);


        return (
            <Modal open onClose={() => !props.modal?.dontCloseOnBackdropClick && props._close()}>
                <ModalDialog {...props.dialogProps}>
                    {props.title && <DialogTitle>{createService.FV(props.title)}</DialogTitle>}
                    <DialogContent sx={{ overflow: "auto" }}>{createService.FV(props.message)}</DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onNext}>{Localize("actions.close")}</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    },
}, {
    fnName: "AlertBigContainer"
});

