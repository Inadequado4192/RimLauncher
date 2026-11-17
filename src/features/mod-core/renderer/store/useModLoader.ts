import { useEffect } from "react";
import { ipc } from "#features/base/renderer";
import { ModCoreIpc } from "../../shared";
import { useModList } from "./modListStore";
import { initDerivedMods } from "./derivedMods";
import { GamePathField, SteamPathField } from "#features/user-config/shared";
import { useConfigField } from "#features/user-config/renderer";

export function useModLoader() {
    const steamPath = useConfigField(SteamPathField);
    const gamePath = useConfigField(GamePathField);

    useEffect(() => initDerivedMods(), []);

    useEffect(() => {
        const unsubs = [
            ipc.on(ModCoreIpc.OnModAdded, (data) => {
                useModList.setState((s) => {
                    if (!s.mods || s.mods.some((m) => m.dirPath === data.dirPath)) return {};

                    return { mods: [...s.mods, data] }
                });
            }),

            ipc.on(ModCoreIpc.OnModRemoved, (dirPath) => {
                useModList.setState((s) => {
                    if (!s.mods) return {};
                    const mods = s.mods.filter((m) => m.dirPath !== dirPath);
                    return mods.length === s.mods.length ? {} : { mods };
                });
            }),
        ];
        return () => {
            unsubs.forEach((u) => u());
            ipc.invoke(ModCoreIpc.StopWatching);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        useModList.setState({ mods: undefined });

        ipc.invoke(ModCoreIpc.LoadAll)
            .then((res) => {
                if (!cancelled) useModList.setState({ mods: res.list });
            })
            .catch(() => {
                if (!cancelled) useModList.setState({ mods: [] });
            });

        return () => { cancelled = true; };
    }, [steamPath, gamePath]);
}