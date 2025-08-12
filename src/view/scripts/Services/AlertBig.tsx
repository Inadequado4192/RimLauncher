"use client";
import { Button, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions, ModalDialogProps } from "@mui/joy";
import React from "react";
import Localize from "@Common/Localize";
import { createService } from "./BaseService";

interface AlertBigData {
    title: React.ReactNode,
    text: React.ReactNode,
    size?: ModalDialogProps["size"],
    minWidth?: ModalDialogProps["minWidth"],
    maxWidth?: ModalDialogProps["maxWidth"],
}

export const {
    Service: AlertBigService,
    Container: AlertBigContainer,
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
            <Modal open>
                <ModalDialog size={props.size} maxWidth={props.maxWidth} minWidth={props.minWidth}>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogContent sx={{ overflow: "auto" }}>{props.text}</DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onNext}>{Localize("close")}</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    },
});