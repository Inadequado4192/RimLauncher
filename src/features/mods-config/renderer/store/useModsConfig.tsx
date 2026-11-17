
import { ipc } from "#features/base/renderer";
import { ModsConfig, ModsConfigIpc } from "#features/mods-config/shared";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ModsConfigState {
    config: ModsConfig | null;
}

export const useModsConfig = create<ModsConfigState>()(
    subscribeWithSelector((): ModsConfigState => ({ config: null }))
);
// export function useModsConfigValue<T>(selector: (config: ModsConfig) => T): T {
//     return useModsConfig(useShallow((s) => {
//         if (!s.config) throw new Error("ModsConfig is not loaded");
//         return selector(s.config);
//     }));
// }

export async function initModsConfig() {
    const config = await ipc.invoke(ModsConfigIpc.Read);
    useModsConfig.setState({ config });

    ipc.on(ModsConfigIpc.Changed, (config) => {
        useModsConfig.setState({ config })
    });
}