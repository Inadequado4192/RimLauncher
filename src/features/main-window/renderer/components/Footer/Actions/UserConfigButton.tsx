import { useLocalize } from "#features/localization/renderer";
import { Button, Typography } from "@mui/joy";
import SettingsIcon from "@mui/icons-material/Settings";
import { createDialog } from "#features/overlays/renderer";
import { UserSettingsConfig } from "../../SettingDialog";

export function UserConfigButton() {
    const t = useLocalize();

    return (
        <Button
            onClick={() => createDialog(<UserSettingsConfig />)}
            startDecorator={<SettingsIcon />}
        >
            <Typography noWrap>{t("mainWindow.settings.title")}</Typography>
        </Button>
    )
}