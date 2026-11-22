import { useEffect, useMemo, useState } from "react";
import { PublishedFileOk, SteamModsLastCheckedConfigField, SteamIpc } from "../shared";
import { useSteamModsWidthSelector } from "#features/steam/renderer";
import { ipc } from "#features/base/renderer";
import { useConfigField } from "#features/user-config/renderer";
import { Result, ok } from "#features/base/shared";

export function useSteamModDetails() {
    const steamModIds = useSteamModsWidthSelector(mods => mods.map(m => m.data.steamId).filter(m => m !== null));
    const [data, setData] = useState<Result<PublishedFileOk[]>>();

    useEffect(() => {
        if (!Object.keys(steamModIds).length) return;

        ipc.invoke(SteamIpc.GetDitails, steamModIds)
            .then(data => setData({ success: true, data }))
            .catch(error => setData({ success: false, error: String(error) }))
    }, [steamModIds]);

    return data;
}
export function useSteamModsUpdates(): Result<PublishedFileOk[]> | undefined {
    const details = useSteamModDetails();
    const lastCheckedAt = useConfigField(SteamModsLastCheckedConfigField);
    return useMemo(() => {
        if (details?.success) {
            return ok(details.data.filter(d => d.time_updated > lastCheckedAt))
        } else return details;
    }, [details, lastCheckedAt]);
}