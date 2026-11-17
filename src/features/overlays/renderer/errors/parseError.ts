import { isLocalKey, type LocalizedString, type LocalKey } from "#features/localization/shared";

const IPC_PREFIX = /^Error invoking remote method '[^']+':\s*(?:\w*Error:\s*)?/;

export function parseError(err: unknown): { text: LocalizedString | null; raw: string } {
    const raw = err instanceof Error ? err.message : String(err);
    const message = raw.replace(IPC_PREFIX, "").trim();

    if (/^[a-zA-Z][\w]*(\.[\w]+)+$/.test(message) && isLocalKey(message)) {
        return { text: message as LocalKey, raw };
    }
    return { text: null, raw: message || raw };
}