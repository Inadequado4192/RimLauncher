import { useLocalize } from "#features/localization/renderer";
import { useConfigField, setConfigField } from "#features/user-config/renderer";
import { CloseAfterRunField } from "#features/user-config/shared";
import { Typography, RadioGroup, Radio } from "@mui/joy";

export function CloseAfterRunRow() {
    const t = useLocalize();
    const checked = useConfigField(CloseAfterRunField);

    return (
        <tr>
            <td><Typography>{t("mainWindow.settings.closeWindowAfterRun")}</Typography></td>
            <td>
                <RadioGroup
                    value={checked}
                    onChange={e => setConfigField(CloseAfterRunField, e.currentTarget.value === "true")}
                >
                    <Radio value="true" label={t("common.answers.yes")} />
                    <Radio value="false" label={t("common.answers.no")} />
                </RadioGroup>
            </td>
        </tr>
    )
}