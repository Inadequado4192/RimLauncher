import { Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { app, dialog, session } from "electron";

@injectable()
export class AppService implements Initializable {
    public constructor() { }

    public async initialize() {
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