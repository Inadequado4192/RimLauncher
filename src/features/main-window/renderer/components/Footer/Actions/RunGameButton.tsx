import { AppIpc } from "#features/app/shared";
import { ipc } from "#features/base/renderer";
import { useLocalize } from "#features/localization/renderer"
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button } from "@mui/joy";

export function RunGameButton() {
    const t = useLocalize();

    return (
        <Button
            color="success"
            startDecorator={<PlayArrowIcon />}
            onClick={() => ipc.invoke(AppIpc.RunGame)}
        >{t("common.actions.run")}</Button>
    )
}