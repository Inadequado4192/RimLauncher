"use client";
import { Button, Modal, ModalDialog, DialogTitle, DialogContent, DialogActions } from "@mui/joy";
import React from "react";
import Localize from "@Common/Localize";


export function AlertBigContainer() {
    const [alerts, setAlerts] = React.useState<AlertData_Internal[]>([]);

    React.useEffect(() => {
        return AlertBigService.subscribe(setAlerts);
    }, []);

    return alerts.map(({ _internalId: id, ...props }, i) => React.createElement(function () {
        function onNext() {
            props._internalCallback();
        }

        React.useEffect(() => {
            function onKeyUp(e: KeyboardEvent) {
                if (e.code == "Enter" || e.code == "Escape") onNext();
            }
            addEventListener("keyup", onKeyUp);
            return () => removeEventListener("keyup", onKeyUp);
        }, []);

        return (
            <Modal open key={i}>
                <ModalDialog>
                    <DialogTitle>{props.title}</DialogTitle>
                    <DialogContent>{props.text}</DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onNext}>{Localize("next")}</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    }, { key: id }));
}


interface AlertData {
    title: React.ReactNode,
    text: React.ReactNode
}
interface AlertData_Internal extends AlertData {
    _internalId: number,
    _internalCallback(): void
}
interface Control {
    endPromise: Promise<void>,
    id: number
}

export class AlertBigService {
    private static listeners = new Set<(alerts: AlertData_Internal[]) => void>();
    private static list: AlertData_Internal[] = [];
    private static idCounter = 0;

    static subscribe(listener: (alerts: AlertData_Internal[]) => void) {
        AlertBigService.listeners.add(listener);
        listener(AlertBigService.list); // Передати початковий стан
        return () => void AlertBigService.listeners.delete(listener);
    }

    static create(rootProps: AlertData):Control {
        const id = AlertBigService.idCounter++;
        return {
            id, endPromise: new Promise<void>((t, f) => {
                try {
            
                    AlertBigService.list = [...AlertBigService.list, {
                        ...rootProps,
                        _internalId: id,
                        _internalCallback() {
                            AlertBigService.remove(id);
                            t();
                        },
                    }];
                    AlertBigService.listeners.forEach((listener) => listener(AlertBigService.list));
                } catch (e) { f(e) }
            })
        };
    }

    static remove(id: number) {
        AlertBigService.list = AlertBigService.list.filter((alert) => alert._internalId !== id);
        AlertBigService.listeners.forEach((listener) => listener(AlertBigService.list));
    }
}
