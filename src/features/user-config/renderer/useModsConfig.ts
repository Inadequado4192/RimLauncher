
import { ipc } from "#features/base/renderer";
import { create } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { ConfigField, RawConfig, UserConfigIpc } from "../shared";
import { useMemo } from "react";



const useRaw = create<{ raw: RawConfig }>()(() => ({ raw: {} }));
export const useConfigLoaded = () => useRaw((s) => Object.keys(s.raw).length > 0);

const parsed = new Map<string, { raw: unknown; value: unknown }>();

function readField<T>(raw: RawConfig, f: ConfigField<T>): T {
    const v = raw[f.key];
    const hit = parsed.get(f.key);
    if (hit && hit.raw === v) return hit.value as T;
    const r = f.schema.safeParse(v);
    const value = r.success ? r.data : f.defaultValue;
    parsed.set(f.key, { raw: v, value });
    return value;
}

export const getConfigField = <T>(f: ConfigField<T>) => readField(useRaw.getState().raw, f);

export function useConfigField<T>(f: ConfigField<T>): T {
    const rawValue = useRaw((s) => s.raw[f.key]);
    return useMemo(() => readField({ [f.key]: rawValue }, f), [rawValue, f]); // safeValue
}

export function useConfigSelector<T, R>(
    f: ConfigField<T>,
    selector: (value: T) => R,
    isEqual?: (a: R, b: R) => boolean,
): R {
    return useStoreWithEqualityFn(
        useRaw,
        (s) => selector(readField(s.raw, f)),
        isEqual,
    );
}

export const setConfigField = <T>(f: ConfigField<T>, value: T) =>
    ipc.invoke(UserConfigIpc.SetField, f.key, value);



export async function initUserConfigStore() {
    useRaw.setState({ raw: await ipc.invoke(UserConfigIpc.Read) });
    ipc.on(UserConfigIpc.Changed, (raw) => useRaw.setState({ raw }));
}

