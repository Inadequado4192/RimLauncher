import yauzl from "yauzl";
import { ArchiveEntry, InspectedArchive } from "../shared";


export async function inspectArchive(
    archivePath: string
): Promise<InspectedArchive> {
    const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
        yauzl.open(
            archivePath,
            {
                lazyEntries: true,
                autoClose: false,
                decodeStrings: true,
            },
            (error, zipFile) => {
                if (error || !zipFile) {
                    reject(error ?? new Error("Failed to open archive"));
                    return;
                }

                resolve(zipFile);
            }
        );
    });

    try {
        const entries = await new Promise<ArchiveEntry[]>((resolve, reject) => {
            const entries: ArchiveEntry[] = [];

            zip.on("error", reject);

            zip.on("entry", entry => {
                const archivePath = entry.fileName.replace(/\\/g, "/");

                entries.push({
                    path: archivePath,
                    size: entry.uncompressedSize,
                    compressedSize: entry.compressedSize,
                    isDirectory: archivePath.endsWith("/"),
                });

                zip.readEntry();
            });

            zip.on("end", () => resolve(entries));

            zip.readEntry();
        });

        return {
            entries,
            suggestedRootDirectory: detectRootDirectory(entries),
        };
    } finally {
        zip.close();
    }
}

function detectRootDirectory(
    entries: ArchiveEntry[]
): string | null {
    let root: string | null = null;

    for (const entry of entries) {
        const parts = entry.path.split("/").filter(Boolean);

        const currentRoot = parts[0];
        if (!currentRoot) continue;

        // Файл безпосередньо в корені архіву.
        if (parts.length === 1 && !entry.isDirectory) {
            return null;
        }


        if (root === null) {
            root = currentRoot;
        } else if (root !== currentRoot) {
            return null;
        }
    }

    return root ? `${root}/` : null;
}