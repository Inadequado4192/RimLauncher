import path from "path";
import fs from "fs/promises";
import { injectable } from "tsyringe";
import { SteamModType } from "../shared";
import { Initializable } from "#features/base/main";
import { ModTypeRegistry } from "#features/mod-type/main";
import { SteamGameId } from "#features/app/shared";

@injectable()
export class SteamService implements Initializable {
    public constructor(
        private _modTypeRegistry: ModTypeRegistry
    ) { }

    public initialize() {
        this._modTypeRegistry.register(SteamModType, {
            priority: 50,
            async detect({ dirPath, aboutDirPath, parentDir: parentDir }) {
                if (parentDir !== SteamGameId) return null;
                const file = path.join(aboutDirPath, "PublishedFileId.txt");
                let steamId: string | null;
                try {
                    steamId = (await fs.readFile(file, "utf8")).trim();
                } catch {
                    steamId = path.basename(dirPath).match(/^(\d+)$/)?.[0] ?? null;
                }
                return {
                    steamId,
                    // warnings: steamId ? [] : ["mods.errors.missingSteamId"]
                };
            },
        });
    }
}