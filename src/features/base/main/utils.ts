import path from "path";

export const isTempDir = (p: string) => path.basename(p).startsWith("~");

export type AccessPlatforms = Extract<typeof process.platform, "win32" | "linux" | "darwin">;
export function byPlatform<T>(data: Record<AccessPlatforms, () => T>): T {
    const platform = process.platform;
    if (platform === "win32" || platform === "linux" || platform === "darwin") {
        return data[platform]();
    }
    throw new Error(`Unsupported platform: ${platform}. Supported: win32, linux, darwin`);
}