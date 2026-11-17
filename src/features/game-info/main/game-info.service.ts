import path from "path";
import fs from "fs/promises";
import { handle, Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { GameInfo, GameInfoIpc } from "../shared";
import { UserConfigService } from "#features/user-config/main";
import { GamePathField } from "#features/user-config/shared";
import { Result, fail } from "#features/base/shared";
import { fullVersionSchema, shortVersionFromFullSchema } from "#features/app/shared";
import { LocalizedString } from "#features/localization/shared";

@injectable()
export class GameInfoService implements Initializable {
    public constructor(private userConfigService: UserConfigService) { }
    public initialize() {
        handle(GameInfoIpc.Read, () => this.get());
    }

    public async get(): Promise<Result<GameInfo, LocalizedString>> {
        const gamePath = (await this.userConfigService.getField(GamePathField));


        if (!gamePath) {
            return fail("game-info.errors.noGamePath");
        }

        try {
            const vText = (await fs.readFile(path.join(gamePath, "Version.txt"))).toString();
            const gameVersionFull = fullVersionSchema.parse(vText);
            const gameVersionShort = shortVersionFromFullSchema.parse(gameVersionFull);
            
            return {
                success: true,
                data: {
                    gamePath,
                    gameVersionFull,
                    gameVersionShort,
                }
            };
        } catch (error) {
            // if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            //     return { success: false, }
            // }
            throw error;
        }
    }
}

