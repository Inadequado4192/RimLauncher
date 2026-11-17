import { useLocalize } from "#features/localization/renderer";
import { useColorScheme, Typography, RadioGroup, Radio } from "@mui/joy";

export function ThemeChangerRow() {
    const t = useLocalize();
    const coolotScheme = useColorScheme();

    const isDark = coolotScheme.mode === "dark";

    return (
        <tr>
            <td><Typography>{t("mainWindow.settings.theme.label")}</Typography></td>
            <td>
                <RadioGroup
                    value={coolotScheme.mode}
                    onChange={() => coolotScheme.setMode(isDark ? "light" : "dark")}
                >

                    <Radio value="light" label={t("mainWindow.settings.theme.light")} />
                    <Radio value="dark" label={t("mainWindow.settings.theme.dark")} />
                </RadioGroup>
            </td>
        </tr>
    )
}