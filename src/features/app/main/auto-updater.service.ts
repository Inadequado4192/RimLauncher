import fs from "fs";
import path from "path";
import { app } from "electron";
import { injectable } from "tsyringe";
import { autoUpdater } from "electron-updater";
import { ProgressInfo, UpdateInfo } from "electron-updater";
import { emitAll, handle, type Initializable } from "#features/base/main";
import { AppIpc, CheckForUpdatesResult } from "../shared";

interface DownloadUpdateOptions {
    onProgress?(percent: number): void;
    onCancelled?(info: UpdateInfo): void;
    onDownloaded?(info: UpdateInfo): void;
    onError?(error: Error): void;
    onFinish?(): void;
}


@injectable()
export class AutoUpdaterService implements Initializable {
    private readonly devConfigPath = path.join(app.getAppPath(), "./dev-app-update.yml");

    public async initialize() {
        autoUpdater.autoDownload = false;

        if (!app.isPackaged && fs.existsSync(this.devConfigPath)) {
            autoUpdater.forceDevUpdateConfig = true;
            autoUpdater.allowDowngrade = true;
        }

        handle(AppIpc.CheckForUpdates, () => this.checkForUpdates());
        handle(AppIpc.QuitAndInstall, () => this.quitAndInstall());
        handle(AppIpc.DownloadUpdate, (_) => {
            const progressId = crypto.randomUUID();
            
            this.downloadUpdate({
                onProgress(percent) {
                    emitAll(AppIpc.ProgressEvent, { progressId, type: "progress", percent });
                },
                onError(error) {
                    emitAll(AppIpc.ProgressEvent, { progressId, type: "error", error: String(error) });
                },
                onDownloaded(_info) {
                    emitAll(AppIpc.ProgressEvent, { progressId, type: "done" });
                }
            });

            return { progressId };
        });
    }

    async checkForUpdates(): Promise<CheckForUpdatesResult | null> {
        if (!app.isPackaged && !fs.existsSync(this.devConfigPath)) {
            return null;
        }

        const result = await autoUpdater.checkForUpdates();

        if (!result) return null;

        return {
            isUpdateAvailable: result.isUpdateAvailable,
            updateInfo: result.updateInfo,
        };
    }

    public async quitAndInstall() {
        autoUpdater.quitAndInstall();
    }

    public async downloadUpdate(options: DownloadUpdateOptions) {
        let finished = false;

        const finish = () => {
            if (finished) return;
            finished = true;

            autoUpdater.off("download-progress", onProgress);
            autoUpdater.off("update-cancelled", onCancelled);
            autoUpdater.off("update-downloaded", onDownloaded);
            autoUpdater.off("error", onError);

            options.onFinish?.();
        };

        const onProgress = (info: ProgressInfo) => {
            options.onProgress?.(info.percent);
        };

        const onCancelled = (info: UpdateInfo) => {
            options.onCancelled?.(info);
            finish();
        };

        const onDownloaded = (info: UpdateInfo) => {
            options.onDownloaded?.(info);
            finish();
        };

        const onError = (error: Error) => {
            options.onError?.(error);
            finish();
        };

        autoUpdater.on("download-progress", onProgress);
        autoUpdater.on("update-cancelled", onCancelled);
        autoUpdater.on("update-downloaded", onDownloaded);
        autoUpdater.on("error", onError);

        try {
            await autoUpdater.downloadUpdate();
        } catch (error) {
            onError(
                error instanceof Error
                    ? error
                    : new Error(String(error)),
            );
        }
    }
}
