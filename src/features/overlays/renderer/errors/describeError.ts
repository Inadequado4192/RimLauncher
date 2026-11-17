import { LocalizedString } from "#features/localization/shared";
import { parseError } from "./parseError";

export interface ErrorView {
    text: LocalizedString | null;
    details?: string;
}

export function describeError(e: unknown): ErrorView {
    if (typeof e === "string") return { text: e as LocalizedString };
    if (e && typeof e === "object" && "key" in e) return { text: e as LocalizedString };

    if (e && typeof e === "object" && "message" in e && typeof e.message !== "string") {
        const path = "path" in e ? String(e.path) : undefined;
        return { text: e.message as LocalizedString, details: path };
    }

    const { text, raw } = parseError(e);
    return { text, details: raw };
}