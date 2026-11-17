import { injectable } from "tsyringe";
import { app } from "electron";
import { Initializable } from "#features/base/main";

const isDevBuild = () => process.env.NODE_ENV !== "production" && !app.isPackaged;

@injectable()
export class DevToolsService implements Initializable {
    private installed: Promise<void> | null = null;

    public initialize() {
        void this.ensureInstalled();
    }

    public ensureInstalled(): Promise<void> {
        if (!isDevBuild()) return Promise.resolve();
        return this.installed ??= this.install();
    }

    private async install(): Promise<void> {
        console.log("devtools: install start")
        await app.whenReady();

        try {
            const { default: installExtension, REACT_DEVELOPER_TOOLS } =
                await import("electron-devtools-installer");

            const ext = await installExtension(REACT_DEVELOPER_TOOLS, {
                loadExtensionOptions: { allowFileAccess: true },
            });

            console.log(`Added Extension: ${ext.name}`);
        } catch (err) {
            console.error("Failed to install extension:", err);
        }
    }
}