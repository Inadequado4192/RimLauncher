import Localize from "@Common/Localize";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import { AlertService } from "@Renderer/scripts/Services/Alert";
import TemplateServices from "@Renderer/scripts/Services/TemplateServices";
import React from "react";

export default function useFetchWorkshopDetails() {
    const mods = __GlobalStores__.mods.use();
    const [data, setData] = React.useState<PublishedFileOk[]>();


    React.useEffect(() => {
        if (data || !Object.keys(mods).length) return;
        // console.log("useFetchWorkshopDetails - effect");

        fetchWorkshopDetails(
            Object.values(mods).filter(mod => mod.isSteam())
                .map(mod => mod.steamId).filter(id => id != null)
        )
            .then(res => {
                setData(res.sort((a, b) => -a.time_updated - -b.time_updated));
            })
            .catch(e => TemplateServices.createErrorAlert(Localize("errors.unableRetrieveChangeNotes"), e));
    }, [mods]);

    return data;
}

const API_URL = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";
const chunk = function <T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
}


const fetchWorkshopDetails = (() => {
    let currentPromise: ReturnType<typeof fetchWorkshopDetails> | null = null;
    const cache: { key: string, data: PublishedFileOk[] }[] = [];
    return async function (ids: (number | string)[]): Promise<PublishedFileOk[]> {
        if (currentPromise) return await currentPromise;

        return currentPromise = new Promise(async (t, f) => {
            try {
                const cacheKey = ids.join(",");
                const cacheDate = cache.find(b => b.key == cacheKey);
                if (cacheDate) return t(cacheDate.data);

                const chunks = chunk(ids, 100);
                const allResults: PublishedFileOk[] = [];

                for (const group of chunks) {
                    const formData = new URLSearchParams();
                    group.forEach((id, index) => {
                        formData.append(`publishedfileids[${index}]`, id.toString());
                    });
                    formData.append("itemcount", group.length.toString());

                    const res = await fetch(API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: formData.toString(),
                    });

                    const data = await res.json();
                    const publishedFile: PublishedFile[] = data.response.publishedfiledetails;

                    allResults.push(...publishedFile.filter(f => f.result == 1));
                }

                cache.push({
                    key: cacheKey,
                    data: allResults
                });

                t(allResults);
            }
            catch (e) {
                f(e);
            }
            finally {
                currentPromise = null;
            }
        });
    }
})();


export type PublishedFile = PublishedFileOk | PublishedFileBad
export type PublishedFileOk = {
    publishedfileid: string,
    result: 1,
    creator: string, // ID
    creator_app_id: number,
    consumer_app_id: number,
    filename: string,
    file_size: string,
    file_url: string,
    hcontent_file: string,
    preview_url: string,
    hcontent_preview: string,
    title: string,
    description: string,
    time_created: number,
    time_updated: number,
    visibility: number,
    banned: number,
    ban_reason: string,
    subscriptions: number,
    favorited: number,
    lifetime_subscriptions: number,
    lifetime_favorited: number,
    views: number,
    // tags: [[Object], [Object]]
}
export type PublishedFileBad = {
    publishedfileid: string
    result: 9
}