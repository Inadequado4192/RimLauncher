"use client";
import { Stack, Alert, AlertProps, Button, IconButton, Typography, Box } from "@mui/joy";
import React from "react";
import InfoIcon from '@mui/icons-material/Info'
import WarningIcon from '@mui/icons-material/Warning';
import ReportIcon from '@mui/icons-material/Report';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';;

import { createService } from "./BaseService";

interface AlertAction {
    label: string,
    onClick?(): void,
}

interface AlertData extends Pick<AlertProps, "color"> {
    message: string
    lifeTime?: number | null,
    actions?: AlertAction[]
}
export const {
    Service: AlertService,
} = createService<AlertData>({
    container({ children }) {
        return (
            <Stack
                spacing={1}
                direction="column"
                alignItems="flex-end"
                sx={t => ({
                    position: "fixed",
                    right: 10, left: 10,
                    bottom: 10,
                    zIndex: t.zIndex.modal + 1
                })}
            >{children}</Stack>
        )
    },
    element(props) {
        const items: Record<NonNullable<AlertProps["color"]>, React.ReactNode> = {
            'success': <CheckCircleIcon />,
            'warning': <WarningIcon />,
            'danger': <ReportIcon />,
            'neutral': <InfoIcon />,
            'primary': <InfoIcon />,
        };

        React.useEffect(() => {
            let lifeTime = props.lifeTime;
            lifeTime ??= 5000;
            if (isFinite(lifeTime))
                setTimeout(() => props._close(), lifeTime);
        }, []);

        return (
            <Alert
                size="md"
                startDecorator={items[props.color ?? "neutral"]}
                endDecorator={
                    <>
                        {props.actions?.map((a, i) =>
                            <Button
                                key={i}
                                variant="plain"
                                size="sm"
                                onClick={a.onClick}
                            >{a.label}</Button>
                        )}
                        <IconButton
                            variant="plain"
                            onClick={() => props._close()}
                        >
                            <CloseRoundedIcon />
                        </IconButton>
                    </>
                }
                sx={{
                    boxShadow: "0 0 10px 10px rgb(0,0,0,.25)",
                    minWidth: 300
                }}
                invertedColors
                variant="outlined"
                color={props.color}
            >
                <Typography>{props.message}</Typography>
            </Alert>
        )
    },
}, {
    fnName: "AlertContainer"
})

export function createErrorAlert(err: unknown) {
    return AlertService.create({
        message: String(err),
        color: "danger",
        lifeTime: Infinity
    })
}