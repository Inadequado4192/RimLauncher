import { useCallback } from "react";
import { create } from "zustand";
import { ipc } from "#features/base/renderer";
import { translate, LocalizationIpc, type LocaleDict, type LocalKey, LocalizedString } from "../shared";

export const useDict = create<{ dict: LocaleDict | null }>()(() => ({ dict: null }));


export function localize(localizedString: LocalizedString): string;
export function localize(key: LocalKey, args?: unknown[]): string;
export function localize(a1: LocalKey | LocalizedString, args?: unknown[]) {
    if (typeof a1 === "string") {
        return translate(useDict.getState().dict, a1, args);
    } else {
        return translate(useDict.getState().dict, a1.key, a1.args);
    }
}

export function useLocalize() {
    const dict = useDict((s) => s.dict);
    return useCallback((s: LocalizedString, args?: unknown[]) => translate(dict, s, args), [dict]);
}


export async function initLocalizationDict() {
    useDict.setState({ dict: await ipc.invoke(LocalizationIpc.Get) });
    ipc.on(LocalizationIpc.Changed, (dict) => useDict.setState({ dict }));
}