import path from "path";
import fs from "fs";
import { app } from "electron";
import { autoUpdater, ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from "electron-updater";

namespace AppAutoUpdater {
    autoUpdater.autoDownload = false;

    const appUpdatePath = appUpdateConfigPath();
    if (!app.isPackaged) {
        if (fs.existsSync(appUpdatePath)) {
            autoUpdater.updateConfigPath = appUpdatePath;
            autoUpdater.forceDevUpdateConfig = true;
        }
    }

    function appUpdateConfigPath(): string {
        return app.isPackaged ? path.join(process.resourcesPath!, "app-update.yml") : path.join(app.getAppPath(), "app-update.yml")
    }

    export async function checkForUpdatesAndNotify() {
        if (!fs.existsSync(appUpdatePath)) return "NotSupported";
        return autoUpdater.checkForUpdatesAndNotify();
    }

    export async function downloadAndInstall(props: {
        onProgress?(percent: number): void,
        onCancelled?(info: UpdateInfo): void
        onDownloaded?(event: UpdateDownloadedEvent): void
        onError?(error: Error, message?: string): void
        onFinish?(): void
    }) {

        function onFinish() {
            autoUpdater.off("download-progress", onDownloadProgress);
            autoUpdater.off("update-cancelled", onUpdateCancelled);
            autoUpdater.off("update-downloaded", updateDownloaded);
            autoUpdater.off("error", onError);

            props.onFinish?.();
        }

        function onDownloadProgress(data: ProgressInfo) {
            props.onProgress?.(data.percent);
        }
        function onUpdateCancelled(info: UpdateInfo) {
            props.onCancelled?.(info);
            onFinish();
        }
        function updateDownloaded(event: UpdateDownloadedEvent) {
            props.onDownloaded?.(event);
            onFinish();
        }
        function onError(error: Error, message?: string) {
            props.onError?.(error, message);
            onFinish();
        }

        autoUpdater.on("download-progress", onDownloadProgress);
        autoUpdater.on("update-cancelled", onUpdateCancelled);
        autoUpdater.on("update-downloaded", updateDownloaded);
        autoUpdater.on("error", onError);


        try { await autoUpdater.downloadUpdate(); }
        catch { }
    }
}
export default AppAutoUpdater;