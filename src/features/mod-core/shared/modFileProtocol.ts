export const MOD_FILE_SCHEME = "mod-file";

export const toModFileUrl = (filePath: string) =>
    `${MOD_FILE_SCHEME}://local/${encodeURIComponent(filePath)}`;