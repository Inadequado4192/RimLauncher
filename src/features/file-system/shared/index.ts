export interface DownloadProgress {
    percent: number;
    progress: number;
    downloadedBytes: number;
    totalBytes: number;
}

export interface DownloadOptions {
    headers?: HeadersInit;
    onProgress?: (progress: DownloadProgress) => void;
}