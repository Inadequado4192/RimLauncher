import { launchGame, stopGame, useGameRunning } from "#features/game-process/renderer";
import { useLocalize } from "#features/localization/renderer"
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PendingIcon from "@mui/icons-material/Pending";
import { Button } from "@mui/joy";
import { useState } from "react";

export function RunGameButton() {
    const t = useLocalize();
    const runningState = useGameRunning();
    const [launching, setLaunching] = useState(false);
    const [stopping, setStopping] = useState(false);
    const stateLoaded = runningState !== undefined;
    const isRunning = runningState?.running ?? false;
    const inProgress = launching || stopping;

    const handleClick = async () => {
        if (!stateLoaded || inProgress) return;

        if (isRunning) {
            setStopping(true);
            stopGame().then(() => setStopping(false));
        } else {
            setLaunching(true);
            launchGame().then(() => setLaunching(false));
        }
    };

    return (
        <Button
            color={inProgress ? "warning" : !stateLoaded ? "neutral" : isRunning ? "danger" : "success"}
            startDecorator={inProgress ? <PendingIcon /> : isRunning ? <StopIcon /> : <PlayArrowIcon />}
            onClick={handleClick}
            disabled={!runningState || inProgress}
            loading={!runningState}
        >
            {t(launching
                ? "game-process.launching"
                : stopping
                    ? "game-process.stopping"
                    : isRunning
                        ? "common.actions.stop"
                        : "common.actions.run")}
        </Button>
    )
}