import { GameInfoContext } from "src/view/scripts/Context/GameInfoContext";
import { Chip } from "@mui/joy";
import React from "react";
import { Mod } from "../Classes/Mod";

export default function ModSupportedVersions({ mod }: { mod: Mod }) {
    const { gameInfo } = React.useContext(GameInfoContext);

    return mod.supportedVersions && (
        [...mod.supportedVersions].reverse().map(v =>
            <Chip
                size="sm"
                sx={{ px: 2 }}
                key={v}
                variant="outlined"
                color={v == gameInfo?.gameVersionShort ? "success" : "danger"}
            >{v}</Chip>)
    )
}
