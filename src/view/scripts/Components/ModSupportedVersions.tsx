import { GameInfoContext } from "src/view/scripts/Context/GameInfoContext";
import { Chip } from "@mui/joy";
import React from "react";

export default function ModSupportedVersions({ mod }: { mod: ModInfo }) {
    const { gameInfo } = React.useContext(GameInfoContext);

    return mod.about.supportedVersions && (
        [...mod.about.supportedVersions].reverse().map(v =>
            <Chip
                size="sm"
                sx={{ px: 2 }}
                key={v}
                variant="outlined"
                color={v == gameInfo?.gameVersionShort ? "success" : "danger"}
            >{v}</Chip>)
    )
}
