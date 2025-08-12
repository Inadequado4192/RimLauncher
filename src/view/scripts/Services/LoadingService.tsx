"use client";
import { Button, Modal, ModalDialog, DialogContent, DialogActions, DialogTitle, Input, FormHelperText, Typography, LinearProgress } from "@mui/joy";
import React from "react";
import { createService } from "./BaseService";
import Localize from "@Common/Localize";
import { AlertService } from "./Alert";



export interface Data {
    // onChangeProgress(progress: number): void
    effect(ev: {
        setProgress(progress: number): void,
        setMessage(message: string): void,
        setValues(progress: number, message: string): void;
        close(): void,
        onError(err: any): void
    }): void
}




export const {
    Service: LoadingService,
    Container: LoadingContainer,
} = createService<Data>({
    element(props) {
        const [progress, setProgress] = React.useState(0);
        const [message, setMessage] = React.useState<string>();

        React.useEffect(() => void props.effect({
            setProgress,
            setMessage,
            setValues(progress, message) {
                setProgress(progress);
                setMessage(message);
            },
            close: () => props._close(),
            onError(err) {
                props._close()
                AlertService.create({
                    text: String(err),
                    color: "danger",
                    lifeTime: Infinity,
                });
            },
        }), []);

        return (
            <Modal open>
                <ModalDialog >
                    <DialogTitle>{Localize("loading")}</DialogTitle>
                    <DialogContent>
                        <LinearProgress
                            determinate
                            value={progress * 100}
                            sx={{ "&:before": { transition: ".2s" } }}
                        />
                        <Typography level="body-xs" fontFamily="monospace">{Math.floor(progress * 100)}% {message}</Typography>
                    </DialogContent>
                </ModalDialog>
            </Modal>
        )
    },
})