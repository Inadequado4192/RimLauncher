import { registerModType, registerModAction, simpleAction } from "#features/mod-type/renderer";
import { SteamModType } from "../shared";
import { SteamIcon } from "./icons";
import { openInSteam } from "./utils";

export function initSteam() {
    registerModType({
        id: SteamModType.id,
        icon: SteamIcon,
        sourceUrl(m) {
            if (SteamModType.is(m)) {
                const steamId = m.data.steamId;
                if (steamId) return `https://steamcommunity.com/sharedfiles/filedetails/?id=${steamId}`;
            }
            return null;
        },
    });


    registerModAction(simpleAction({
        id: "open-in-steam",
        order: 75,
        when: (m) => !!(SteamModType.is(m) && m.data.steamId),
        icon: SteamIcon,
        label: "mods.actions.openInSteam",
        run: (m) => {
            if (SteamModType.is(m)) {
                const steamId = m.data.steamId;
                if (steamId) return openInSteam(steamId);
            }
        },
    }));
}