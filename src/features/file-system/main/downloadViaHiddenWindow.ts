import { BrowserWindow } from "electron";
import fs from "fs/promises";
import { DownloadProgress } from "../shared";

const PROGRESS_INTERVAL = 100;

export async function downloadViaHiddenWindow(
    url: string,
    destinationFilePath: string,
    options: {
        onProgress?: (progress: DownloadProgress) => void;
        headers?: Record<string, string>
    } = {},
): Promise<void> {
    let win: BrowserWindow | null = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: true,
            images: false,
        },
    });

    try {
        await new Promise<void>((resolve, reject) => {
            const currentWindow = win!;

            currentWindow.webContents.session.once("will-download", (_event, item) => {
                item.setSavePath(destinationFilePath);

                let lastProgressUpdate = 0;

                item.on("updated", (_event, state) => {
                    if (state !== "progressing") return;

                    const now = Date.now();

                    if (now - lastProgressUpdate < PROGRESS_INTERVAL) {
                        return;
                    }

                    lastProgressUpdate = now;

                    const downloadedBytes = item.getReceivedBytes();
                    const totalBytes = item.getTotalBytes();

                    options.onProgress?.({
                        percent: totalBytes > 0
                            ? Math.floor(downloadedBytes / totalBytes * 100)
                            : 0,
                        progress: totalBytes > 0
                            ? downloadedBytes / totalBytes
                            : 0,
                        downloadedBytes,
                        totalBytes,
                    });
                });

                item.once("done", (_event, state) => {
                    if (state === "completed") {
                        const downloadedBytes = item.getReceivedBytes();
                        const totalBytes = item.getTotalBytes();

                        options.onProgress?.({
                            percent: 100,
                            progress: 1,
                            downloadedBytes,
                            totalBytes,
                        });

                        resolve();
                    } else {
                        reject(new Error(`Download failed: ${state}`));
                    }
                });
            },
            );

            currentWindow.webContents.downloadURL(url, { headers: options.headers });
        });
    } catch (error) {
        await fs.rm(destinationFilePath, { force: true });
        throw error;
    } finally {
        win?.close();
        win = null;
    }
}