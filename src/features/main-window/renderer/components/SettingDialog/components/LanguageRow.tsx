import { ipc } from "#features/base/renderer";
import { useLocalize } from "#features/localization/renderer";
import { LanguageField, LocaleDict, LocalizationIpc } from "#features/localization/shared";
import { useConfigField } from "#features/user-config/renderer";
import { Option, Select, Typography } from "@mui/joy";
import { useState, useEffect } from "react";

export function LanguageRow() {
    const t = useLocalize();
    const language = useConfigField(LanguageField);
    const [languages, setLanguages] = useState<LocaleDict[]>([]);

    useEffect(() => {
        ipc.invoke(LocalizationIpc.GetLanguages).then(setLanguages);
    }, []);

    return (
        <tr>
            <td><Typography>{t("language.config")}</Typography></td>
            <td>
            <Select
                value={language}
                onChange={(_, code) => code && ipc.invoke(LocalizationIpc.SetLanguage, code)}
            >
                {languages.map((l) => (
                    <Option key={l.code} value={l.code}>{l.name}</Option>
                ))}
            </Select>
            </td>
        </tr>
    );
}