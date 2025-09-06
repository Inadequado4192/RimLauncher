"use client";
import Localize from "@Common/Localize";
import { Button, Modal, ModalDialog, DialogContent, DialogActions, DialogTitle, Input, FormHelperText, Typography } from "@mui/joy";
import React from "react";
import { createService } from "./BaseService";

export interface ConfirmData {
    title?: React.ReactNode,
    message?: React.ReactNode,
    actionsLabel?: {
        true?: string,
        false?: string,
    },
    fullWidth?: boolean
}

export const {
    Service: ConfirmService,
} = createService<ConfirmData, boolean>({
    element(props) {
        function onClose() {
            props._close(false);
        }
        function onOk() {
            props._close(true);
        }

        React.useEffect(() => {
            function onKeyUp(e: KeyboardEvent) {
                if (e.code == "Enter") onOk();
                if (e.code == "Escape") onClose();
            }
            addEventListener("keyup", onKeyUp);
            return () => removeEventListener("keyup", onKeyUp);
        }, []);

        return (
            <Modal open onClose={onClose}>
                <ModalDialog minWidth={!props.fullWidth ? void 0 : "80%"} maxWidth={!props.fullWidth ? void 0 : "90%"}>
                    {props.title && <DialogTitle>{props.title}</DialogTitle>}
                    <DialogContent>
                        <Typography>{props.message}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onOk}>{props.actionsLabel?.true ?? Localize("common.yes")}</Button>
                        <Button color="danger" onClick={onClose}>{props.actionsLabel?.false ?? Localize("common.no")}</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    },
}, {
    fnName: "ConfirmContainer"
});