import fs from "fs/promises";
import path from "path";

export async function getAllFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(entry => {
            const res = path.join(dir, entry.name);
            return entry.isDirectory() ? getAllFiles(res) : res;
        })
    );
    return files.flat();
}

export async function getTotalSize(files: string[]): Promise<number> {
    const stats = await Promise.all(files.map(f => fs.stat(f)));
    return stats.reduce((sum, stat) => sum + stat.size, 0);
}

export async function copyDirWithProgress(src: string, dest: string, onProgress?: (percent: number) => void) {
    const files = await getAllFiles(src);
    const totalSize = await getTotalSize(files);
    let copiedSize = 0;

    for (const file of files) {
        const rel = path.relative(src, file);
        const destPath = path.join(dest, rel);
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        const data = await fs.readFile(file);
        await fs.writeFile(destPath, data);

        copiedSize += data.length;
        onProgress?.(copiedSize / totalSize);
    }
}
