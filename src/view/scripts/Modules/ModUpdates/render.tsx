import DOMPurify from "dompurify";
import Localize from "@Common/Localize";
import { Typography, Stack, CircularProgress, Table, Button, AccordionGroup, Accordion, AccordionSummary, AccordionDetails, LinearProgress, Box } from "@mui/joy";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import { AlertService } from "@Renderer/scripts/Services/Alert";
import { openModChangesInSteam } from "@Renderer/scripts/utils";
import React from "react";
import useFetchWorkshopDetails, { PublishedFile } from "./useFetchWorkshopDetails";
import { UserConfigStore } from "@Renderer/scripts/Stores";
import { TableVirtuoso } from "react-virtuoso";
import { AlertBigService } from "@Renderer/scripts/Services/AlertBig";

export default function Render() {


    return (
        <Stack height="100%">
            <Typography level="body-sm" my={1}>{Localize("NONAMED.modUpdatesHint")}</Typography>
            <Box flex={1}>
                <DataTable />
            </Box>
        </Stack>
    )
}

function DataTable() {
    const data = useFetchWorkshopDetails();
    const [lastViewAt, setLastView] = React.useState<number>(); // without milliseconds

    React.useEffect(() => {
        const userLastCheckModUpdates = UserConfigStore.get().lastCheckModUpdates;
        setLastView(new Date(userLastCheckModUpdates).getTime() / 1000);
        $invoke.setUserConfigByKey("lastCheckModUpdates", new Date().toISOString());
    }, []);

    return (
        <TableVirtuoso
            data={data}
            components={{
                Table(props) {
                    return <Table {...props} />;
                },
                TableRow(props) {
                    let highlight = props.item.time_updated > (lastViewAt ?? Infinity)

                    return (
                        <tr
                            {...props}
                            style={{
                                ...props.style,
                                background: highlight ? "var(--joy-palette-success-softBg)" : void 0,
                                color: highlight ? "var(--joy-palette-success-softColor)" : void 0,
                                verticalAlign: "baseline",
                            }}
                        />
                    )
                }
            }}
            fixedHeaderContent={function fixedHeaderContent() {
                return (
                    <tr>
                        <th style={{ width: 150 }}> {Localize("updates.updateTime")}</th >
                        <th style={{ width: 300 }}>{Localize("common.name")}</th>
                        <th style={{ width: 100 }} align="right">{Localize("common.size")}</th>
                        <th>{Localize("info.description")}</th>
                    </tr>
                )
            }}
            itemContent={function ItemContent(index, publishedFile) {
                return <Content publishedFile={publishedFile} />;
            }}
        />
    );
}



const Content = React.memo(function Content({ publishedFile }: { publishedFile: PublishedFile }) {

    async function loadChanges() {
        AlertBigService.create(({
            message() {
                const [changes, setChanges] = React.useState<Awaited<ReturnType<typeof fetchChangeNote>>>();

                React.useEffect(() => {
                    fetchChangeNote(publishedFile.publishedfileid)
                        .then(setChanges);
                }, []);

                return (
                    <Box sx={{ whiteSpace: "break-spaces" }}>
                        {changes === undefined ? <LinearProgress /> : (
                            !changes ? "ERROR" : changes.map((b, i) => (
                                <React.Fragment key={i}>
                                    <Typography color="warning">{b.time}</Typography>
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
                            ))
                        )}
                    </Box>
                )
            },
            dialogProps: {
                minWidth: "75vw"
            }
        }))
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
                <Button onClick={loadChanges} fullWidth>{Localize("actions.review")}</Button>
            </td>
        </>
    )
});






async function fetchChangeNote(workshopId: string) {
    try {
        const url = `https://steamcommunity.com/sharedfiles/filedetails/changelog/${workshopId}`;
        const res = await fetch(url);
        const html = await res.text();

        // Парсимо HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Збираємо блоки
        const blocks = Array.from(
            doc.querySelectorAll("#profileBlock .workshopAnnouncement")
        ).map((el) => {
            const headline = el.querySelector(".headline");
            const paragraph = el.querySelector("p");

            return {
                time: headline?.innerHTML.trim() ?? "",
                text: paragraph?.innerHTML.trim().replace(/\\n/g, "\n") ?? "",
            };
        });

        return blocks;

    } catch {
        AlertService.create({
            text: Localize("errors.unableRetrieveChangeNotes"),
            color: "danger"
        });
        return null;
    }
}

