import path from "path";
import { pathToFileURL } from "url";
import { app, net, protocol } from "electron";
import { injectable } from "tsyringe";
import { Initializable } from "#features/base/main";
import { UserConfigService } from "#features/user-config/main";
import { MOD_FILE_SCHEME } from "../shared";

protocol.registerSchemesAsPrivileged([
    { scheme: MOD_FILE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

@injectable()
export class ModFileProtocolService implements Initializable {
    public constructor(private _userConfigService: UserConfigService) { }

    public async initialize() {
        await app.whenReady();

        protocol.handle(MOD_FILE_SCHEME, async (req) => {
            const filePath = path.resolve(decodeURIComponent(new URL(req.url).pathname.slice(1)));

            if (!IMAGE_EXT.has(path.extname(filePath).toLowerCase()) || !this.isAllowed(filePath)) {
                return new Response("Forbidden", { status: 403 });
            }
            return net.fetch(pathToFileURL(filePath).toString());
        });
    }

    private async isAllowed(filePath: string) {
        const roots: string[] = Object.values(await this._userConfigService.getModsPaths()).filter((r): r is string => !!r)
        const p = filePath.toLowerCase();
        return roots.some((r) => p.startsWith(path.resolve(r).toLowerCase() + path.sep));
    }
}