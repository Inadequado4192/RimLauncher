import { DialogContent, DialogTitle, Divider, ModalDialog, Table, Typography } from "@mui/joy";
import { useLocalize } from "#features/localization/renderer";
import { CloseAfterRunRow, LanguageRow, PathesForm, ThemeChangerRow } from "./components";

export function UserSettingsConfig() {
    const t = useLocalize();

    return (
        <ModalDialog minWidth="md">
            <DialogTitle>{t("mainWindow.settings.title")}</DialogTitle>

            <Divider><Typography>{t("mainWindow.settings.paths.title")}</Typography></Divider>

            <PathesForm />

            <Divider />
            <DialogContent>
                <Table borderAxis="none" variant="plain" sx={{ width: "auto", alignSelf: "baseline" }}>
                    <tbody>
                        <CloseAfterRunRow />
                        <ThemeChangerRow />
                        <LanguageRow />
                    </tbody>
                </Table>
            </DialogContent>
        </ModalDialog>
    )
}

