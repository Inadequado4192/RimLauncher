import en from "./locales/en-US.json";

export type LocaleDict = typeof en;

type Paths<T, P extends string = ""> = {
    [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>
}[keyof T & string];
export type LocalKey = Paths<LocaleDict["keys"]>;


export type LocalizedString = LocalKey | { key: LocalKey; args?: unknown[] };

export function translate(dict: LocaleDict | null, s: LocalizedString, args?: unknown[]): string {
    const key = typeof s === "string" ? s : s.key;
    const a = typeof s === "string" ? args : (s.args ?? args);

    let value: unknown = dict?.keys;
    for (const part of key.split(".")) {
        if (value && typeof value === "object" && part in value) value = (value as any)[part];
        else return key;
    }
    if (typeof value !== "string") return key;
    return a ? value.replace(/\{(\d+)\}/g, (_, i) => String(a[+i] ?? "")) : value;
}

export function translateString(dict: LocaleDict | null, s: LocalizedString) {
    return typeof s === "string" ? translate(dict, s) : translate(dict, s.key, s.args);
}

export function isLocalKey(s: string): s is LocalKey {
    let value: unknown = en.keys;
    for (const part of s.split(".")) {
        if (value && typeof value === "object" && part in value) value = (value as any)[part];
        else return false;
    }
    return typeof value === "string";
}