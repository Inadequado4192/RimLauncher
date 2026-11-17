import { ipc } from "#features/base/renderer";
import { useLocalize } from "#features/localization/renderer";
import { LocalKey } from "#features/localization/shared";
import { SystemIpc } from "#features/system/shared";
import { setConfigField, useConfigField } from "#features/user-config/renderer";
import { GamePathField, PathKey, SteamPathField, UserConfigIpc } from "#features/user-config/shared";
import { FormControl, FormLabel, Input, ButtonGroup, Button, FormHelperText } from "@mui/joy";
import { memo, useState, useEffect } from "react";



interface PathFieldProps {
    label: string;
    value: string | null;
    error?: LocalKey;
    onChange: (path: string) => void;
}

const PathField = memo(function PathField({ label, value, error, onChange }: PathFieldProps) {
    const t = useLocalize();

    const choose = async () => {
        const path = await ipc.invoke(SystemIpc.SelectPath, { type: "folder" });
        if (path) onChange(path);
    };

    return (
        <FormControl error={!!error}>
            <FormLabel>{label}</FormLabel>
            <Input
                value={value ?? ""}
                readOnly
                startDecorator={
                    <ButtonGroup>
                        <Button onClick={choose}>{t("common.actions.change")}</Button>
                        <Button
                            disabled={!value}
                            onClick={() => value && ipc.invoke(SystemIpc.OpenPath, value)}
                        >
                            {t("common.actions.open")}
                        </Button>
                    </ButtonGroup>
                }
            />
            {error && <FormHelperText>{t(error)}</FormHelperText>}
        </FormControl>
    );
});

function usePathErrors() {
    const steamPath = useConfigField(SteamPathField);
    const gamePath = useConfigField(GamePathField);
    const [errors, setErrors] = useState<Partial<Record<PathKey, LocalKey>>>({});

    useEffect(() => {
        let actual = true;
        ipc.invoke(UserConfigIpc.ValidatePaths).then((e) => actual && setErrors(e));
        return () => { actual = false; };
    }, [steamPath, gamePath]);

    return errors;
}

function SteamPathFieldComp({ error }: { error?: LocalKey }) {
    const t = useLocalize();
    const value = useConfigField(SteamPathField);
    return (
        <PathField
            label={t("mainWindow.settings.paths.steam")}
            value={value}
            error={error}
            onChange={(steamPath) => setConfigField(SteamPathField, steamPath)}
        />
    );
}

function GamePathFieldComp({ error }: { error?: LocalKey }) {
    const t = useLocalize();
    const value = useConfigField(GamePathField);
    return (
        <PathField
            label={t("mainWindow.settings.paths.game")}
            value={value}
            error={error}
            onChange={(gamePath) => setConfigField(GamePathField, gamePath)}
        />
    );
}

export function PathesForm() {
    const errors = usePathErrors();
    return (
        <>
            <SteamPathFieldComp error={errors.steamPath} />
            <GamePathFieldComp error={errors.gamePath} />
        </>
    );
}