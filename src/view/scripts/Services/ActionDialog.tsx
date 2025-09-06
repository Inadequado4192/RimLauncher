"use client";
import { Button, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions, ModalDialogProps, ButtonProps } from "@mui/joy";
import React from "react";
import { createService, ServiceData_Internal } from "./BaseService";

interface Action {
    color?: ButtonProps["color"]
    label: string,
    disabled?: boolean,
    onClick?(props: ServiceData_Internal<ActionDialogData, void>): void,
}
interface ActionDialogData {
    title: (() => React.ReactNode) | React.ReactNode,
    body: (() => React.ReactNode) | React.ReactNode,
    actions: Action[],
    fullWidth?: boolean,
    minWidth?: ModalDialogProps["minWidth"],
    maxWidth?: ModalDialogProps["maxWidth"],
    dontCloseOnBackdropClick?: boolean
}

export const { Service: ActionDialogService } = createService<ActionDialogData>({
    element(props) {
        return (
            <Modal open onClose={() => !props.dontCloseOnBackdropClick && props._close()}>
                <ModalDialog maxWidth={props.fullWidth ? "90%" : props.maxWidth} minWidth={props.fullWidth ? "90%" : props.minWidth}>
                    <DialogTitle>{createService.FV(props.title)}</DialogTitle>
                    <DialogContent sx={{ overflow: "auto" }}>{createService.FV(props.body)}</DialogContent>
                    <DialogActions>
                        {props.actions.map((a, i) =>
                            <Button
                                key={i}
                                color={a.color}
                                onClick={() => a.onClick?.(props)}
                                disabled={a.disabled}
                            >{a.label}</Button>
                        )}
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    },
}, {
    fnName: "ActionDialogContainer"
});