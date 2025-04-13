import * as cheerio from "cheerio";
import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, CircularProgress, LinearProgress, Stack, Table, Typography } from "@mui/joy";
import Localize from "@Common/Localize";
import { ModListContext } from "@Context/ModListContext";
import { UserConfigContext } from "@Context/UserConfigContext";
import { openModChangesInSteam, openModInSteam } from "../../utils";


export default function ModUpdates() {
    const { userConfig: config } = React.useContext(UserConfigContext);
    const data = useFetchWorkshopDetails();
    const [lastViewAt, setLastView] = React.useState<number>(); // without milliseconds

    React.useEffect(() => {
        if (!config || lastViewAt) return;
        setLastView(new Date(config.lastCheckModUpdates).getTime() / 1000);
        invoke.setUserConfigByKey("lastCheckModUpdates", new Date().toISOString());
    }, [config]);


    return !data ? (
        <Stack height="100%" justifyContent="center" alignItems="center" >
            <CircularProgress />
        </Stack>
    ) : (
        <Table>
            <thead>
                <tr>
                    <th style={{ width: 150 }}> {Localize("updateTime")}</th >
                    <th style={{ width: 300 }}>{Localize("name")}</th>
                    <th style={{ width: 100 }}>{Localize("size")}</th>
                    <th>{Localize("description")}</th>
                </tr >
            </thead >
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


ModUpdates.useTestName = () => {
    const { userConfig: config } = React.useContext(UserConfigContext);
    const [value, setValue] = React.useState(false);
    const data = useFetchWorkshopDetails();

    React.useEffect(() => {
        if (config && data?.[0]) {
            setValue(new Date(config.lastCheckModUpdates).getTime() < data[0].time_updated * 1000);
        }
    }, [config?.lastCheckModUpdates, data]);

    return value;
}

function ModRow({ publishedFile, highlight }: { publishedFile: PublishedFile, highlight: boolean }) {
    const [changes, setChanges] = React.useState<Awaited<ReturnType<typeof fetchChangeNote>> & {}>();
    const [loading, setLoading] = React.useState(false);

    async function loadChanges() {
        setLoading(true);
        const changes = await fetchChangeNote(publishedFile.publishedfileid);
        if (changes) setChanges(changes);
        setLoading(false);
    }

    return (
        <Box
            sx={t => ({
                background: highlight ? t.palette.success.softBg : void 0,
                color: highlight ? t.palette.success.softColor : void 0,
                verticalAlign: "baseline"
            })}
            component="tr"
        >
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
                                ? <LinearProgress />
                                : (
                                    <>
                                        {changes.map((b, i) => (
                                            <React.Fragment key={i}>
                                                <Typography color="warning">{b.time}</Typography>
                                                <Typography level="body-sm">{b.text}</Typography>
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
        </Box>
    )
}


function useFetchWorkshopDetails() {
    const modList = React.useContext(ModListContext);
    const [data, setData] = React.useState<PublishedFile[]>();


    React.useEffect(() => {
        if (data || !modList.mods.length) return;

        fetchWorkshopDetails(
            modList.mods.filter(mod => mod.type === "Steam" && mod.steamId)
                .map(mod => mod.steamId!)
        )
            .then(res => setData(res.sort((a, b) => -a.time_updated - -b.time_updated)));
    }, [modList.mods]);

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
                currentPromise = null;
            } catch (e) { f(e); }
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
            text: $(el).children("p").html()?.trim().replace(/\<br\>|\\n/g, "\n") ?? "",
        })).get();
        return blocks;
    } catch {
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