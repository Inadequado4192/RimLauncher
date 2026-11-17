import yauzl from "yauzl";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { UnzipProgress } from "../shared";

const PROGRESS_INTERVAL = 100;

function isExcluded(
    entryPath: string,
    excludedPaths: Set<string>,
): boolean {
    for (const excluded of excludedPaths) {
        if (
            entryPath === excluded ||
            entryPath.startsWith(
                excluded.endsWith("/") ? excluded : excluded + "/",
            )
        ) {
            return true;
        }
    }

    return false;
}

export async function extractArchive(
    archivePath: string,
    outputDir: string,
    excludedPaths: Iterable<string> = [],
    onProgress?: (progress: UnzipProgress) => void,
): Promise<void> {
    const root = path.resolve(outputDir);

    const excluded = new Set(
        [...excludedPaths].map(p => p.replace(/\\/g, "/")),
    );

    // Pass 1: calculate total size.
    const zipInfo = await yauzl.openPromise(archivePath);

    let totalBytes = 0;
    let totalFiles = 0;

    try {
        for await (const entry of zipInfo.eachEntry()) {
            if (entry.fileName.endsWith("/")) continue;
            if (isExcluded(entry.fileName, excluded)) continue;

            totalBytes += entry.uncompressedSize;
            totalFiles++;
        }
    } finally {
        zipInfo.close();
    }

    // Pass 2: extract files.
    let extractedBytes = 0;
    let extractedFiles = 0;
    let lastProgressUpdate = 0;

    const reportProgress = (force = false) => {
        const now = Date.now();

        if (!force && now - lastProgressUpdate < PROGRESS_INTERVAL) {
            return;
        }

        lastProgressUpdate = now;

        onProgress?.({
            extractedBytes,
            totalBytes,
            extractedFiles,
            totalFiles,
            percent: totalBytes > 0 ? Math.floor(extractedBytes / totalBytes * 100) : 0
        });
    };

    reportProgress(true);

    const zip = await yauzl.openPromise(archivePath, {
        autoClose: false,
    });

    try {
        for await (const entry of zip.eachEntry()) {
            const relativePath = entry.fileName.replace(/\\/g, "/");

            if (isExcluded(relativePath, excluded)) continue;

            const destination = path.resolve(root, relativePath);

            // Zip Slip protection.
            if (
                destination !== root &&
                !destination.startsWith(root + path.sep)
            ) {
                throw new Error(`Unsafe archive path: ${entry.fileName}`);
            }

            if (entry.fileName.endsWith("/")) {
                await mkdir(destination, { recursive: true });
                continue;
            }

            await mkdir(path.dirname(destination), {
                recursive: true,
            });

            const readStream = await zip.openReadStreamPromise(entry);

            readStream.on("data", (chunk: Buffer) => {
                extractedBytes += chunk.length;
                reportProgress();
            });

            await pipeline(
                readStream,
                createWriteStream(destination),
            );

            extractedFiles++;
            reportProgress();
        }
    } finally {
        zip.close();
    }

    extractedBytes = totalBytes;
    extractedFiles = totalFiles;

    reportProgress(true);
}