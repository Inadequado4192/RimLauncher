import { Store } from "./store";


export const ModsConfigStore = new Store<ModsConfig>({
    firstLoad: $invoke.getModsConfig.bind($invoke),
    watcher: (f) => $on.ModsConfig_Changed((e, data) => f(data)),
});

export const UserConfigStore = new Store<UserConfig>({
    firstLoad: $invoke.getUserConfig.bind($invoke),
    watcher: (f) => $on.UserConfig_Changed((e, data) => f(data)),
});

export const GameInfoStore = new Store({
    firstLoad: async () => {
        const res = await $invoke.getGameInfo();
        if (res.success) return res.data as GameInfoData;
        return { error: res.message } as { error: string } & Partial<GameInfoData>
    },
});