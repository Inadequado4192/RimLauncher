import { createWriteStream } from "fs";
import fs from "fs/promises";
import { pipeline } from "stream/promises";
import { DownloadOptions } from "../shared";

const PROGRESS_INTERVAL = 100;

export async function downloadFile(
    url: string,
    destinationFilePath: string,
    options: DownloadOptions = {},
): Promise<void> {
    try {
        const response = await fetch(url, {
            headers: options.headers,
        });

        if (!response.ok || !response.body) {
            const body = await response.text();

            throw new Error(
                `HTTP ${response.status} ${response.statusText}: ${body.slice(0, 1000)}`,
            );
        }

        const totalBytes = Number(response.headers.get("content-length")) || 0;
        let downloadedBytes = 0;
        let lastProgressUpdate = 0;

        const fileStream = createWriteStream(destinationFilePath);

        const progressStream = new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
                downloadedBytes += chunk.byteLength;

                const now = Date.now();

                if (now - lastProgressUpdate >= PROGRESS_INTERVAL) {
                    lastProgressUpdate = now;

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
                }

                controller.enqueue(chunk);
            },
        });

        await pipeline(
            response.body.pipeThrough(progressStream),
            fileStream,
        );

        // Фінальне оновлення після завершення завантаження.
        options.onProgress?.({
            percent: 100,
            progress: 1,
            downloadedBytes,
            totalBytes,
        });
    } catch (error) {
        await fs.rm(destinationFilePath, { force: true });
        throw error;
    }
}