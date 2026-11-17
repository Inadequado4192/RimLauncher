import { openUrl } from "#features/system/renderer";
import { steamWorkShopProtocol } from "../shared";

export const openInSteam = (steamId: string) => openUrl(steamWorkShopProtocol(steamId));