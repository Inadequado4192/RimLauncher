"use client";
import Localize from "@common/Localize";
import { LocalContext } from "src/view/scripts/Context/LocalContext";
import { Button, Modal, ModalDialog, DialogContent, DialogActions, DialogTitle, Input, FormHelperText, Typography } from "@mui/joy";
import React from "react";



export function ConfirmContainer() {
    const [list, setList] = React.useState<ConfirmData_Internal[]>([]);

    React.useEffect(() => {
        return ConfirmService.subscribe(setList);
    }, []);

    return list.map(({ _internalId: id, ...props }, i) => React.createElement(function () {
        function onClose() {
            props._internalCallback(false);
        }
        function onOk() {
            props._internalCallback(true);
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
            <Modal open key={i} onClose={onClose}>
                <ModalDialog>
                    <DialogTitle>{Localize("confirmTheAction")}</DialogTitle>
                    <DialogContent>
                        <Typography>{props.text}</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onOk}>{Localize("yes")}</Button>
                        <Button color="danger" onClick={onClose}>{Localize("no")}</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    }, { key: id }));
}


export interface ConfirmData {
    text: string,
}
interface ConfirmData_Internal extends ConfirmData {
    _internalId: number,
    _internalCallback(data: boolean): void
}

export class ConfirmService {
    private static listeners = new Set<(alerts: ConfirmData_Internal[]) => void>();
    private static list: ConfirmData_Internal[] = [];
    private static idCounter = 0;

    static subscribe(listener: (alerts: ConfirmData_Internal[]) => void) {
        ConfirmService.listeners.add(listener);
        listener(ConfirmService.list);
        return () => void ConfirmService.listeners.delete(listener);
    }

    static create(props: ConfirmData) {
        return new Promise<boolean>((t, f) => {
            try {
                const id = ConfirmService.idCounter++;

                ConfirmService.list = [...ConfirmService.list, {
                    ...props,
                    _internalId: id,
                    _internalCallback(data) {
                        ConfirmService.remove(id);
                        t(data);
                    },
                }];
                ConfirmService.listeners.forEach((listener) => listener(ConfirmService.list));
            } catch (e) { f(e); }
        })
    }

    static remove(id: number) {
        ConfirmService.list = ConfirmService.list.filter((alert) => alert._internalId !== id);
        ConfirmService.listeners.forEach((listener) => listener(ConfirmService.list));
    }
}
