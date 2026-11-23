import { injectable } from "tsyringe";
import { app, session } from "electron";
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
        await app.whenReady();

        try {
            const { REACT_DEVELOPER_TOOLS } =
                await import("electron-devtools-installer");
            const { downloadChromeExtension } =
                await import("electron-devtools-installer/dist/downloadChromeExtension");

            const extensionId = REACT_DEVELOPER_TOOLS.id;
            const targetSession = session.defaultSession;
            const installed = targetSession.extensions
                .getAllExtensions()
                .find(extension => extension.id === extensionId);

            if (installed) return;

            const extensionFolder = await downloadChromeExtension(extensionId);
            const extension = await targetSession.extensions.loadExtension(extensionFolder, {
                allowFileAccess: true,
            });

            console.log(`Added Extension: ${extension.name}`);
        } catch (err) {
            console.error("Failed to install extension:", err);
        }
    }
}