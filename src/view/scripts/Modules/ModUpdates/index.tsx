import * as cheerio from "cheerio";
import DOMPurify from "dompurify";
import React from "react";
import { useInView } from "react-intersection-observer";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, CircularProgress, LinearProgress, Stack, Table, Typography } from "@mui/joy";
import Localize from "@Common/Localize";
import { ModListStore } from "@Context/ModListContext";
import { openModChangesInSteam } from "../../utils";
import { AlertService } from "@Services/Alert";
import { UserConfigStore } from "@Stores";
import { StoreCompareType } from "@Stores/store";


export default function ModUpdates() {
    const data = useFetchWorkshopDetails();
    const [lastViewAt, setLastView] = React.useState<number>(); // without milliseconds

    React.useEffect(() => {
        const userLastCheckModUpdates = UserConfigStore.get().lastCheckModUpdates;
        setLastView(new Date(userLastCheckModUpdates).getTime() / 1000);
        $invoke.setUserConfigByKey("lastCheckModUpdates", new Date().toISOString());
    }, []);


    return (
        <>
            <Typography level="body-sm" my={1}>{Localize("modUpdates_hint")}</Typography>
            {
                !data ? (
                    <Stack height="50%" justifyContent="center" alignItems="center" >
                        <CircularProgress />
                    </Stack>
                ) : (
                    <Table>
                        <thead>
                            <tr>
                                <th style={{ width: 150 }}> {Localize("updateTime")}</th >
                                <th style={{ width: 300 }}>{Localize("name")}</th>
                                <th style={{ width: 100 }} align="right">{Localize("size")}</th>
                                <th>{Localize("description")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(publishedFile => {
                                let highlight = publishedFile.time_updated > (lastViewAt ?? Infinity)
                                return <ModRow
                                    key={publishedFile.publishedfileid}
                                    publishedFile={publishedFile}
                                    highlight={highlight}
                                />;
                            })}
                        </tbody>
                    </Table >
                )
            }
        </>
    )
}


ModUpdates.useNotify = () => {
    const userLastCheckModUpdates = UserConfigStore.use(uc => uc.lastCheckModUpdates, StoreCompareType.Primitive);
    const [value, setValue] = React.useState(false);
    const data = useFetchWorkshopDetails();

    React.useEffect(() => {
        if (data?.[0]) {
            setValue(new Date(userLastCheckModUpdates).getTime() < data[0].time_updated * 1000);
        }
    }, [userLastCheckModUpdates, data]);

    return value;
}



function ModRow({ publishedFile, highlight }: { publishedFile: PublishedFile, highlight: boolean }) {
    const { ref, inView } = useInView({ threshold: 0 });

    const Content = React.useCallback(() => {
        const [changes, setChanges] = React.useState<Awaited<ReturnType<typeof fetchChangeNote>> & {}>();
        const [loading, setLoading] = React.useState(false);

        async function loadChanges() {
            setLoading(true);
            const changes = await fetchChangeNote(publishedFile.publishedfileid);
            if (changes) setChanges(changes);
            setLoading(false);
        }

        return (
            <>
                <td>{new Date(publishedFile.time_updated * 1000).toLocaleString()}</td>
                <td title={publishedFile.title}>
                    <Button
                        fullWidth
                        onClick={() => openModChangesInSteam(publishedFile.publishedfileid)}
                    ><Typography noWrap>{publishedFile.title}</Typography></Button>
                </td>
                <td align="right">{(+publishedFile.file_size / 1000000).toFixed(1)} MB</td>
                <td>
                    <AccordionGroup>
                        <Accordion
                            variant="soft"
                            onChange={(ev, e) => {
                                if (e && !changes && !loading) loadChanges();
                            }}
                        >
                            <AccordionSummary>{Localize("review")}</AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    whiteSpace: "break-spaces"
                                }}
                            >
                                {!changes
                                    ? loading ? <LinearProgress /> : "..."
                                    : (
                                        <>
                                            {changes.map((b, i) => (
                                                <React.Fragment key={i}>
                                                    <Typography color="warning">{b.time}</Typography>
                                                    {/* <Typography level="body-sm">{}</Typography> */}
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: DOMPurify.sanitize(b.text, {
                                                                ALLOWED_TAGS: ["br", "a"],
                                                                ALLOWED_ATTR: ["href"],
                                                            })
                                                        }}
                                                    />
                                                    {i !== changes.length - 1 ? <br /> : null}
                                                </React.Fragment>
                                            ))}
                                        </>
                                    )
                                }
                            </AccordionDetails>
                        </Accordion>
                    </AccordionGroup>
                </td>
            </>
        )
    }, [publishedFile])

    return (
        <Box
            ref={ref}
            sx={t => ({
                background: highlight ? t.palette.success.softBg : void 0,
                color: highlight ? t.palette.success.softColor : void 0,
                verticalAlign: "baseline",
                height: 50,
            })}
            component="tr"
        >{inView && <Content />}</Box>
    )
}


function useFetchWorkshopDetails() {
    const mods = ModListStore.mods.use();
    const [data, setData] = React.useState<PublishedFile[]>();


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
            .catch((e) => {
                AlertService.create({
                    text: Localize("UnableRetrieveChangeNotes", [e.message ?? String(e)]),
                    color: "danger",
                    lifeTime: null
                })
            })
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
    const cache: { key: string, data: PublishedFile[] }[] = [];
    return async function (ids: (number | string)[]): Promise<PublishedFile[]> {
        if (currentPromise) return await currentPromise;

        return currentPromise = new Promise(async (t, f) => {
            try {
                const cacheKey = ids.join(",");
                const cacheDate = cache.find(b => b.key == cacheKey);
                if (cacheDate) return t(cacheDate.data);

                const chunks = chunk(ids, 100);
                const allResults: PublishedFile[] = [];

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
                    allResults.push(...data.response.publishedfiledetails);
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


async function fetchChangeNote(workshopId: string) {
    try {
        const url = `https://steamcommunity.com/sharedfiles/filedetails/changelog/${workshopId}`;
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);
        const blocks = $('#profileBlock .workshopAnnouncement').map((_, el) => ({
            time: $(el).children(".headline").html()?.trim() ?? "",
            text: $(el).children("p").html()?.trim().replace(/\\n/g, "\n") ?? "",
        })).get();
        return blocks;
    } catch {
        AlertService.create({
            text: Localize("UnableRetrieveChangeNotes"),
            color: "danger"
        });
        return null;
    }
}


type PublishedFile = {
    publishedfileid: string,
    result: number,
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