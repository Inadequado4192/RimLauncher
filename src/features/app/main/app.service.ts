import { handle, Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { AppIpc, SteamGameId } from "../shared";
import { UserConfigService } from "#features/user-config/main";
import { CloseAfterRunField } from "#features/user-config/shared";
import { app, dialog, session, shell } from "electron";

@injectable()
export class AppService implements Initializable {
    public constructor(
        private _userConfigService: UserConfigService,
    ) { }

    public async initialize() {
        handle(AppIpc.GetInfo, () => ({ name: app.getName(), version: app.getVersion() }))

        handle(AppIpc.RunGame, async (_) => {
            shell.openExternal(`steam://launch/${SteamGameId}`);
            const doClose = await this._userConfigService.getField(CloseAfterRunField);
            if (doClose) _.window?.close();
        });

        app.on("window-all-closed", () => {
            if (process.platform !== "darwin") app.quit();
        });


        process.on("uncaughtException", (err) => {
            console.error("Uncaught Exception:", err);

            dialog.showErrorBox(
                "Unexpected Error",
                err.stack || err.message
            );

            app.exit(1);
        });

        process.on("unhandledRejection", (reason) => {
            const msg = String(reason);
            console.error("Uncaught Exception:", msg);

            dialog.showErrorBox("Unexpected Error", msg);

            app.exit(1);
        });

        await app.whenReady();
        session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    }
}