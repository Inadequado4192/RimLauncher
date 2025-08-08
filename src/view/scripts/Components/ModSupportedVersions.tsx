import { Chip } from "@mui/joy";
import React from "react";
import { Mod } from "@Classes/Mod";
import { GameInfoStore } from "@Stores";

export default function ModSupportedVersions({ mod }: { mod: Mod }) {
    const gameVersionShort = GameInfoStore.use(gi => gi.gameVersionShort)

    return mod.about.supportedVersions && (
        [...mod.about.supportedVersions].reverse().map(v =>
            <Chip
                size="sm"
                sx={{ px: 2 }}
                key={v}
                variant="outlined"
                color={v == gameVersionShort ? "success" : "danger"}
            >{v}</Chip>)
    )
}
