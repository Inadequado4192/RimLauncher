import { createStore, StoreApi, useStore } from "zustand";
import { Button, LinearProgress, Typography } from "@mui/joy";
import { useLocalize } from "#features/localization/renderer";
import { createDialog, useDialogClose, DialogFrame } from "../dialogs";

interface ProgressState {
    title: string;
    label: string | null;        // що зараз відбувається: "Downloading", "Extracting"
    percent: number | null;      // null = невідомо (смуга без значення)
    details: string | null;      // "12.3 / 40 MB"
    error: string | null;
}

export interface ProgressTask {
    update(patch: Partial<Omit<ProgressState, "title" | "error">>): void;
    fail(message: string): void;     // показує помилку й кнопку «Закрити»
    close(): void;                   // успішне завершення
}

type Store = StoreApi<ProgressState>;

function ProgressDialog({ store, onCancel }: { store: Store; onCancel?: () => void }) {
    const t = useLocalize();
    const close = useDialogClose();
    const { title, label, percent, details, error } = useStore(store);

    return (
        <DialogFrame
            title={title}
            minWidth={360}
            actions={
                error ? <Button onClick={() => close()}>{t("common.actions.close")}</Button>
                    : onCancel ? <Button variant="plain" color="neutral" onClick={onCancel}>{t("common.actions.cancel")}</Button>
                        : undefined
            }
        >
            {error ? (
                <Typography color="danger">{error}</Typography>
            ) : (
                <>
                    {label && <Typography level="body-sm">{label}</Typography>}
                    <LinearProgress
                        determinate={percent !== null}
                        value={percent ?? 0}
                        sx={{ my: 1 }}
                    />
                    <Typography level="body-xs">
                        {[percent !== null ? `${percent}%` : null, details].filter(Boolean).join(" · ")}
                    </Typography>
                </>
            )}
        </DialogFrame>
    );
}

export function createProgress(opts: {
    title?: string;
    label?: string
    onCancel?: () => void
} = {}): ProgressTask {
    const store = createStore<ProgressState>(() => ({
        title: opts.title ?? "loadign",
        label: opts.label ?? null,
        percent: null,
        details: null,
        error: null,
    }));

    let closeDialog: () => void;
    // body викликається синхронно, тому closeDialog заповнюється одразу
    createDialog<void>(
        (close) => {
            closeDialog = () => close();
            return <ProgressDialog store={store} onCancel={opts.onCancel} />;
        },
        { dismissable: false },
    );

    return {
        update: (patch) => store.setState(patch),
        fail: (message) => store.setState({ error: message }),
        close: () => closeDialog(),
    };
}