// overlays/renderer/dialogs/prompt.tsx
import { ComponentType } from "react";
import { useState } from "react";
import {
    Button, DialogActions, DialogContent, DialogTitle,
    FormControl, FormHelperText, Input, ModalDialog,
} from "@mui/joy";
import { localize, useLocalize } from "#features/localization/renderer";
import { createDialog } from "../dialogStore";

export interface FieldProps<T> {
    value: T;
    onChange: (value: T) => void;
}
interface FormDialogOptions<T> {
    title: string;
    initialValue: T;
    Field: ComponentType<FieldProps<T>>;
    validate?: (value: T) => string | null;
}

function FormDialog<T>({ title, initialValue, Field, validate, onClose }: FormDialogOptions<T> & {
    onClose: (result: T | null) => void;
}) {
    const t = useLocalize();
    const [value, setValue] = useState(initialValue);
    const [touched, setTouched] = useState(false);

    const error = validate?.(value) ?? null;

    const field = (
        <Field
            value={value}
            onChange={(v) => {
                setValue(v);
                setTouched(true);
            }}
        />
    );

    return (
        <ModalDialog>
            <DialogTitle>{title}</DialogTitle>

            <form onSubmit={(e) => {
                e.preventDefault();
                setTouched(true);
                if (!error) onClose(value);
            }}>
                <DialogContent>
                    <FormControl error={touched && !!error}>
                        {field}
                        {touched && error && (
                            <FormHelperText>{error}</FormHelperText>
                        )}
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button type="submit" disabled={!!error}>
                        {t("common.actions.save")}
                    </Button>

                    <Button variant="plain" onClick={() => onClose(null)}>
                        {t("common.actions.cancel")}
                    </Button>
                </DialogActions>
            </form>
        </ModalDialog>
    );
}

/** Універсальний діалог: повертає значення поля або null, якщо скасовано */
export const createFormDialog = <T,>(options: FormDialogOptions<T>) =>
    createDialog<T | null>((close) => <FormDialog {...options} onClose={close} />)
        .then((r) => r ?? null);







interface PromptOptions {
    title: string;
    defaultValue?: string;
    placeholder?: string;
    validate?: (value: string) => string | null;
    Field?: ComponentType<FieldProps<string>>;
}

export function createPrompt({ title, defaultValue = "", placeholder, validate, Field }: PromptOptions) {
    const t = localize;

    const TextField = ({ value, onChange }: FieldProps<string>) => (
        <Input autoFocus value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    );

    return createFormDialog<string>({
        title,
        initialValue: defaultValue,
        Field: Field ?? TextField,
        validate: (v) => (!v.trim() ? t("common.validation.blank") : validate?.(v.trim()) ?? null),
    }).then((r) => r?.trim() ?? null);
}