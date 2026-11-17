export interface ArchiveEntry {
    path: string;
    size: number;
    compressedSize: number;
    isDirectory: boolean;
}

export interface InspectedArchive {
    entries: ArchiveEntry[];
    suggestedRootDirectory: string | null;
}

export interface UnzipProgress {
    extractedBytes: number;
    totalBytes: number;
    extractedFiles: number;
    totalFiles: number;
    percent: number;
}