import { useEffect, useMemo, useState } from "react";
import { PublishedFileOk, SteamModsLastCheckedConfigField, SteamIpc } from "../shared";
import { useSteamModsWidthSelector } from "#features/steam/renderer";
import { ipc } from "#features/base/renderer";
import { createBackgroundTask } from "#features/overlays/renderer";
import { useConfigField } from "#features/user-config/renderer";

export function useSteamModDetails() {
    const steamModIds = useSteamModsWidthSelector(mods => mods.map(m => m.data.steamId).filter(m => m !== null));
    const [data, setData] = useState<PublishedFileOk[]>();

    useEffect(() => {
        if (!Object.keys(steamModIds).length) return;

        ipc.invoke(SteamIpc.GetDitails, steamModIds)
            .then(setData)
            .catch(createBackgroundTask.error.bind({}, "Steam details"))
    }, [steamModIds]);

    return data;
}
export function useSteamModsUpdates() {
    const details = useSteamModDetails();
    const lastCheckedAt = useConfigField(SteamModsLastCheckedConfigField);
    return useMemo(() => details?.filter(d => d.time_updated > lastCheckedAt), [details, lastCheckedAt]);
}