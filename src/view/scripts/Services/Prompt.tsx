"use client";
import { Button, Modal, ModalDialog, DialogContent, DialogActions, DialogTitle, Input, FormHelperText, Typography } from "@mui/joy";
import React from "react";



export function PromptContainer() {
    const [list, setList] = React.useState<PromptData_Internal[]>([]);

    React.useEffect(() => {
        return PromptService.subscribe(setList);
    }, []);

    return list.map(({ _internalId: id, ...props }, i) => React.createElement(function () {
        const [inputText, setInputText] = React.useState("");
        const [message, setMessage] = React.useState<ReturnType<typeof props.onValidate & {}>>()

        const okIsDisabled = !inputText || (message?.severity == "danger");

        function onChange(e: React.ChangeEvent<HTMLInputElement>) {
            const val = e.target.value;
            setInputText(val);
            setMessage(props.onValidate?.(val));
        }

        function onClose() {
            props.onCancle?.();
            props._internalCallback(null);
        }
        function onOk() {
            if (okIsDisabled) return;
            props.onOk?.();
            props._internalCallback(inputText);
        }

        return (
            <Modal open key={i} onClose={onClose}>
                <ModalDialog>
                    <DialogTitle>{props.text}</DialogTitle>
                    <DialogContent>
                        <Input
                            ref={(ref) => ref?.querySelector("input")?.focus()}
                            value={inputText}
                            onChange={onChange}
                            onKeyUp={e => e.code == "Enter" && onOk()}
                        />
                        {message && <Typography color={message.severity}>{message.text}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onOk} disabled={okIsDisabled}>Ok</Button>
                        <Button color="danger" onClick={onClose}>Cancle</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    }, { key: id }));
}


export interface PromptData {
    text: string,
    onOk?(): void,
    onCancle?(): void,
    onValidate?(value: string): undefined | { text: string, severity: "danger" | "success" | "warning" }
}
interface PromptData_Internal extends PromptData {
    _internalId: number,
    _internalCallback(data: string | null): void
}

export class PromptService {
    private static listeners = new Set<(alerts: PromptData_Internal[]) => void>();
    private static list: PromptData_Internal[] = [];
    private static idCounter = 0;

    static subscribe(listener: (alerts: PromptData_Internal[]) => void) {
        PromptService.listeners.add(listener);
        listener(PromptService.list);
        return () => void PromptService.listeners.delete(listener);
    }

    static create(props: PromptData) {
        return new Promise<string | null>((t, f) => {
            try {
                const id = PromptService.idCounter++;

                PromptService.list = [...PromptService.list, {
                    ...props,
                    _internalId: id,
                    _internalCallback(data) {
                        PromptService.remove(id);
                        t(data);
                    },
                }];
                PromptService.listeners.forEach((listener) => listener(PromptService.list));
            } catch (e) { f(e); }
        })
    }

    static remove(id: number) {
        PromptService.list = PromptService.list.filter((alert) => alert._internalId !== id);
        PromptService.listeners.forEach((listener) => listener(PromptService.list));
    }
}
