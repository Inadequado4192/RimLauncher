import { handle, Initializable } from "#features/base/main";
import { injectable } from "tsyringe";
import { PublishedFile, PublishedFileOk, SteamIpc, SteamModsLastCheckedConfigField } from "../shared";
import { Cache, CacheService } from "../../cache/main/cache.service";
import { hours } from "#features/time/shared";
import { UserConfigService } from "#features/user-config/main";

const chunks = function <T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
}
@injectable()
export class SteamService implements Initializable {
    private API_URL = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";

    private _steamDetailsCache: Cache<PublishedFile>;

    public constructor(
        _cacheService: CacheService,
        private readonly _userConfigService: UserConfigService,
    ) {
        this._steamDetailsCache = _cacheService.namespace("steam-details", hours(1));
    }

    public initialize() {
        this._userConfigService.registerField(SteamModsLastCheckedConfigField);

        handle(SteamIpc.GetDitails, async (_, steamIds) => {
            const resultOk: PublishedFileOk[] = [];

            // Getting from cache
            const remainIds: string[] = []
            for (const steamId of steamIds) {
                const publishedFile = await this._steamDetailsCache.get(steamId);
                if (!publishedFile) remainIds.push(steamId);
                else if (publishedFile.result === 1) resultOk.push(publishedFile);
            }


            for (const chunk of chunks(remainIds, 100)) {
                const formData = new URLSearchParams();
                chunk.forEach((id, index) => {
                    formData.append(`publishedfileids[${index}]`, id);
                });
                formData.append("itemcount", chunk.length.toString());

                const res = await fetch(this.API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: formData.toString(),
                });

                const data = await res.json();
                const publishedFiles: PublishedFile[] = data.response.publishedfiledetails;

                for (const r of publishedFiles) {
                    this._steamDetailsCache.set(r.publishedfileid, r);
                    if (r.result === 1) resultOk.push(r);
                }
            }

            return resultOk.sort((a, b) => -a.time_updated - -b.time_updated);
        });

        handle(SteamIpc.GetChangeLog, async (_, id) => this.fetchChangelog(id));
    }

    private async fetchChangelog(workshopId: string): Promise<string> {
        const res = await fetch(`https://steamcommunity.com/sharedfiles/filedetails/changelog/${workshopId}`);
        if (!res.ok) throw new Error(`Steam ${res.status}`);
        return await res.text();
    }


    // const fetchWorkshopDetails = (() => {
    //     let currentPromise: ReturnType<typeof fetchWorkshopDetails> | null = null;
    //     const cache: { key: string, data: PublishedFileOk[] }[] = [];
    //     return async function (ids: (number | string)[]): Promise<PublishedFileOk[]> {
    //         if (currentPromise) return await currentPromise;

    //         return currentPromise = new Promise(async (t, f) => {
    //             try {
    //                 const cacheKey = ids.join(",");
    //                 const cacheDate = cache.find(b => b.key == cacheKey);
    //                 if (cacheDate) return t(cacheDate.data);

    //                 const chunks = chunk(ids, 100);
    //                 const allResults: PublishedFileOk[] = [];

    //                 for (const group of chunks) {
    //                     const formData = new URLSearchParams();
    //                     group.forEach((id, index) => {
    //                         formData.append(`publishedfileids[${index}]`, id.toString());
    //                     });
    //                     formData.append("itemcount", group.length.toString());

    //                     const res = await fetch(API_URL, {
    //                         method: "POST",
    //                         headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //                         body: formData.toString(),
    //                     });

    //                     const data = await res.json();
    //                     const publishedFile: PublishedFile[] = data.response.publishedfiledetails;

    //                     allResults.push(...publishedFile.filter(f => f.result == 1));
    //                 }

    //                 cache.push({
    //                     key: cacheKey,
    //                     data: allResults
    //                 });

    //                 t(allResults);
    //             }
    //             catch (e) {
    //                 f(e);
    //             }
    //             finally {
    //                 currentPromise = null;
    //             }
    //         });
    //     }
    // })();

}