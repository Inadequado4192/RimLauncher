import Localize from "@Common/Localize";
import { Link, Typography } from "@mui/joy";
import { ActionDialogService } from "@Renderer/scripts/Services/ActionDialog";
import { openUrl } from "@Renderer/scripts/utils";

export default function createBugReportWindow() {
    return ActionDialogService.create({
        title: Localize("windows.bugReport.title"),
        body: <Typography>{Localize("windows.bugReport.message")}</Typography>,
        actions: [
            {
                label: Localize("actions.close"),
                onClick: (p) => p._close()
            },
            {
                label: Localize("actions.report"),
                color: "danger",
                onClick: () => openUrl("https://github.com/Inadequado4192/RimLauncher/issues/new")
            },
            {
                label: Localize("windows.bugReport.reportWithAI"),
                color: "danger",
                onClick: () => openUrl(`https://github.com/copilot?prompt=${encodeURI(Localize("windows.bugReport.reportWithAI_prompt"))}`)
            },
        ],
    });
}