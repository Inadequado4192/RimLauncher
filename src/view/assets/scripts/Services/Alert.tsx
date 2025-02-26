"use client";
import { Stack, Alert, AlertProps, Button } from "@mui/joy";
import React from "react";



export function AlertContainer() {
    const [alerts, setAlerts] = React.useState<AlertDataWithId[]>([]);

    React.useEffect(() => {
        return AlertService.subscribe(setAlerts);
    }, []);

    return (
        <Stack
            spacing={1}
            direction="column"
            sx={{
                position: "fixed",
                right: 10,
                bottom: 10,
                zIndex: 999999999
            }}
        >
            {alerts.map(({ _internalId: id, ...props }, i) => (
                <Alert
                    key={i}
                    endDecorator={<Button variant="outlined" onClick={() => AlertService.remove(id)}>Close</Button>}
                    sx={{
                        boxShadow: "0 0 10px 10px rgb(0,0,0,.5)"
                    }}
                    {...props}
                >{props.text}</Alert>
            ))}
        </Stack>
    )
}


interface AlertData extends AlertProps {
    text: string
    lifeTime?: number | null,
}
interface AlertDataWithId extends AlertData {
    _internalId: number
}

export class AlertService {
    private static listeners = new Set<(alerts: AlertDataWithId[]) => void>();
    private static list: AlertDataWithId[] = [];
    private static idCounter = 0;

    static subscribe(listener: (alerts: AlertDataWithId[]) => void) {
        AlertService.listeners.add(listener);
        listener(AlertService.list); // Передати початковий стан
        return () => void AlertService.listeners.delete(listener);
    }

    static create(rootProps: AlertData) {
        const lifeTime = rootProps["lifeTime"];
        delete rootProps["lifeTime"];

        const id = AlertService.idCounter++;

        AlertService.list = [...AlertService.list, {
            ...rootProps,
            _internalId: id
        }];
        AlertService.listeners.forEach((listener) => listener(AlertService.list));
        if (lifeTime !== null) setTimeout(() => AlertService.remove(id), lifeTime ?? 5000);
    }

    static remove(id: number) {
        AlertService.list = AlertService.list.filter((alert) => alert._internalId !== id);
        AlertService.listeners.forEach((listener) => listener(AlertService.list));
    }
}
