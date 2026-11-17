import { Button, DialogActions, DialogContent, DialogTitle, ModalDialog } from "@mui/joy";
import BugReportIcon from "@mui/icons-material/BugReport";
import { useLocalize } from "#features/localization/renderer";
import { openUrl } from "#features/system/renderer";
import { createDialog } from "#features/overlays/renderer";
import { appGitRepo } from "#features/app/shared";


export function BugReportButton() {
    return (
        <Button onClick={() => createDialog(<BugReportDialog />)} color="danger">
            <BugReportIcon />
        </Button>
    )
}


export default function BugReportDialog() {
    const t = useLocalize();
    return (
        <ModalDialog>
            <DialogTitle>{t("mainWindow.bugReport.title")}</DialogTitle>
            <DialogContent>{t("mainWindow.bugReport.message")}</DialogContent>
            <DialogActions>
                <Button onClick={() => openUrl(`https://github.com/${appGitRepo}/issues/new`)}>
                    {t("common.actions.report")}
                </Button>
                <Button onClick={() => openUrl(`https://github.com/copilot?prompt=${encodeURI(t("mainWindow.bugReport.reportWithAI.prompt", [appGitRepo]))}`)}>
                    {t("mainWindow.bugReport.reportWithAI.label")}
                </Button>
            </DialogActions>
        </ModalDialog>
    )
}