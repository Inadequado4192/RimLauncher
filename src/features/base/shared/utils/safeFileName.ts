const FORBIDDEN = /[<>:"/\\|?*\x00-\x1f\x7f]/g;
const RESERVED = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;

export interface SafeFileNameOptions {
    fallback?: string;
    maxBytes?: number;
}

export function toSafeFileName(name: string, opts: SafeFileNameOptions = {}): string {
    const { fallback = "untitled", maxBytes = 120 } = opts;

    let s = name
        .normalize("NFC")
        .replace(FORBIDDEN, "_")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\.+/, "")
        .replace(/[. ]+$/, "");

    s = truncateBytes(s, maxBytes).replace(/[. ]+$/, "");

    if (!s) return fallback;
    if (RESERVED.test(s)) s = `_${s}`;
    return s;
}

function truncateBytes(s: string, max: number): string {
    const enc = new TextEncoder();
    if (enc.encode(s).length <= max) return s;

    let out = "";
    for (const ch of s) {
        if (enc.encode(out + ch).length > max) break;
        out += ch;
    }
    return out.trimEnd();
}