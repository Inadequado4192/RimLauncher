import { shell } from "electron";

export function openUrl(url: string) {
    // window.open(url, "_blank");
    shell.openExternal(url);
}


export function openModInSteam(steamId: string) {
    openUrl(`steam://url/CommunityFilePage/${steamId}`);
}
export function openModChangesInSteam(steamId: string) {
    openUrl(`steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/changelog/${steamId}`);
}