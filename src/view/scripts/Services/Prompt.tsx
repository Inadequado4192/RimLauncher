"use client";
import { Button, Modal, ModalDialog, DialogContent, DialogActions, DialogTitle, Input, FormHelperText, Typography } from "@mui/joy";
import React from "react";
import { createService } from "./BaseService";

export interface PromptData {
    text: React.ReactNode,
    defaultError?: string,
    defaultValue?: string,

    onOk?(): void,
    onCancle?(): void,
    /** Working at `onChange`
     * @returns `true` - ok. `string` - error message
     */
    // onValidate?(value: string): undefined | { text: string, severity: "danger" | "success" | "warning" },
    onValidate?(value: string): true | string
    /**
     * @param true Success. Close window
     * @param false Error. Keep window
     * @deprecated
     */
    asyncPending?(value: string): Promise<boolean | string>
    /**@deprecated */
    pendingText?(value: string): string
}




export const {
    Service: PromptService,
    Container: PromptContainer,
} = createService<PromptData, null | string>({
    element(props) {
        const [inputText, setInputText] = React.useState(props.defaultValue ?? "");
        const [errorMessage, setErrorMessage] = React.useState<string | undefined>(props.defaultError);
        const [isPending, setIsPending] = React.useState(false);

        const okIsDisabled = !inputText || !!errorMessage;

        function onChange(e: React.ChangeEvent<HTMLInputElement>) {
            if (isPending) return;
            const val = e.target.value;
            setInputText(val);
            const validateRes = props.onValidate?.(val);
            if (typeof validateRes == "string") setErrorMessage(validateRes);
            else setErrorMessage(undefined);
        }

        function onClose() {
            if (isPending) return;
            props.onCancle?.();
            props._close(null);
        }
        async function onOk() {
            if (isPending || okIsDisabled) return;
            props.onOk?.();

            if (props.asyncPending) {
                setIsPending(true)
                try {
                    let res = await props.asyncPending(inputText);
                    if (res !== true) {
                        if (res !== false) setErrorMessage(res);
                        return;
                    }
                } catch (e) {
                    throw e;
                } finally {
                    setIsPending(false);
                }
            }
            props._close(inputText);
        }

        return (
            <Modal open onClose={onClose}>
                <ModalDialog >
                    <DialogTitle>{props.text}</DialogTitle>
                    <DialogContent>
                        <Input
                            ref={(ref) => ref?.querySelector("input")?.focus()}
                            value={inputText}
                            onChange={onChange}
                            onKeyUp={e => e.code == "Enter" && onOk()}
                            disabled={isPending}
                        />
                        {errorMessage && <Typography color="danger">{errorMessage}</Typography>}
                        {isPending && props.pendingText && <Typography color="primary">{props.pendingText(inputText)}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button color="success" onClick={onOk} disabled={isPending || okIsDisabled}>Ok</Button>
                        <Button color="danger" onClick={onClose} disabled={isPending}>Cancle</Button>
                    </DialogActions>
                </ModalDialog>
            </Modal>
        )
    },
})