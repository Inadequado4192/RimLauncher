import { ModEntry } from "#features/mod-type/shared";
import { SteamModType } from "./modType";

export const getSteamId = (m: ModEntry) => SteamModType.is(m) ? m.data.steamId : null;
export const steamWorkShopProtocol = (steamId: string) => `steam://url/CommunityFilePage/${steamId}`;