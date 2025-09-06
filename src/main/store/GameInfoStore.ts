import Localize from "@Common/Localize";
import { Pathes } from "@Main/Pathes";
import fs from "fs";
import path from "path";

namespace GameInfoStore {
    export function get() {
        if (!Pathes.Dir_Game) return {
            success: false as const,
            message: Localize("errors.gamePathIsUndefined"),
        }

        if (!fs.existsSync(path.join(Pathes.Dir_Game, "Version.txt"))) {
            return {
                success: false as const,
            }
        }

        const gameVersionFull = fs.readFileSync(path.join(Pathes.Dir_Game, "Version.txt")).toString().trim() as FullVersion;
        const gameVersionShort = gameVersionFull.match(/^(\d+\.\d+)./)![1]! as ShortVersion;

        return {
            success: true as const,
            data: {
                gamePath: Pathes.Dir_Game,
                gameVersionFull, gameVersionShort,
            } satisfies GameInfoData
        };
    }
}

export default GameInfoStore;