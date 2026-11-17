import { localize, useLocalize } from "#features/localization/renderer";
import { Button, DialogContent, DialogTitle, LinearProgress, ModalClose, ModalDialog, Table, Typography } from "@mui/joy";
import { TableVirtuoso } from "react-virtuoso";
import { useSteamModDetails } from "./useSteamModDetails";
import { getConfigField, setConfigField } from "#features/user-config/renderer";
import { PublishedFileOk, SteamIpc, SteamModsLastCheckedConfigField } from "../shared";
import { Fragment, memo, useEffect, useState } from "react";
import { openInSteam } from "#features/steam/renderer";
import { createBackgroundTask, createDialog } from "#features/overlays/renderer";
import DOMPurify from "dompurify";
import { ipc } from "#features/base/renderer";

export function SteamUpdatesDialog({ onClose }: {
    onClose: () => void
}) {
    const t = useLocalize();

    const data = useSteamModDetails();
    const [lastViewAt, setLastViewAt] = useState(0);


    useEffect(() => {
        setLastViewAt(getConfigField(SteamModsLastCheckedConfigField));
        setConfigField(SteamModsLastCheckedConfigField, Math.floor(Date.now() / 1000))
    }, []);


    return (
        <ModalDialog minWidth="xl">
            <ModalClose onClick={onClose} />
            <DialogTitle>{t("steamUpdates.title")}</DialogTitle>
            <DialogContent>
                {
                    !data
                        ? <LinearProgress />
                        : (
                            <TableVirtuoso
                                style={{ height: 500 }}
                                data={data}
                                components={{
                                    Table(props) {
                                        return <Table {...props} />;
                                    },
                                    TableRow(props) {
                                        const highlight = props.item.time_updated > (lastViewAt ?? Infinity)

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
                                            <th style={{ width: 150 }}> {t("common.fields.updateTime")}</th >
                                            <th style={{ width: 300 }}>{t("common.fields.name")}</th>
                                            <th style={{ width: 100 }} align="right">{t("common.fields.size")}</th>
                                            <th>{t("mods.details.description")}</th>
                                        </tr>
                                    )
                                }}
                                itemContent={function ItemContent(index, publishedFile) {
                                    return <Content publishedFile={publishedFile} />;
                                }}
                            />
                        )
                }
            </DialogContent>
        </ModalDialog>
    )
}


const Content = memo(function Content({ publishedFile }: { publishedFile: PublishedFileOk }) {
    const t = useLocalize();

    return (
        <>
            <td>{new Date(publishedFile.time_updated * 1000).toLocaleString()}</td>
            <td title={publishedFile.title}>
                <Button fullWidth onClick={() => openInSteam(publishedFile.publishedfileid)}>
                    <Typography noWrap>{publishedFile.title}</Typography>
                </Button>
            </td >
            <td align="right">{(+publishedFile.file_size / 1000000).toFixed(1)} MB</td>
            <td>
                <Button onClick={() => createDialog(<ChangeNotesDialog publishedfileid={publishedFile.publishedfileid} />)} fullWidth>{t("common.actions.review")}</Button>
            </td>
        </>
    )
});

// async function loadChanges() {

//     createDialog(<ChangeNotesDialog />);
//     // AlertBigService.create(({
//     //     message() {
//     //         const [changes, setChanges] = React.useState<Awaited<ReturnType<typeof fetchChangeNote>>>();

//     //         React.useEffect(() => {
//     //             fetchChangeNote(publishedFile.publishedfileid)
//     //                 .then(setChanges);
//     //         }, []);

//     //         return (
//     //             <Box sx={{ whiteSpace: "break-spaces" }}>
//     //                 {changes === undefined ? <LinearProgress /> : (
//     //                     !changes ? "ERROR" : changes.map((b, i) => (
//     //                         <React.Fragment key={i}>
//     //                             <Typography color="warning">{b.time}</Typography>
//     //                             <div
//     //                                 dangerouslySetInnerHTML={{
//     //                                     __html: DOMPurify.sanitize(b.text, {
//     //                                         ALLOWED_TAGS: ["br", "a"],
//     //                                         ALLOWED_ATTR: ["href"],
//     //                                     })
//     //                                 }}
//     //                             />
//     //                             {i !== changes.length - 1 ? <br /> : null}
//     //                         </React.Fragment>
//     //                     ))
//     //                 )}
//     //             </Box>
//     //         )
//     //     },
//     //     dialogProps: {
//     //         minWidth: "75vw"
//     //     }
//     // }))
// }
function ChangeNotesDialog({ publishedfileid }: { publishedfileid: string }) {
    const [changes, setChanges] = useState<Awaited<ReturnType<typeof fetchChangeNote>>>();

    useEffect(() => void fetchChangeNote(publishedfileid).then(setChanges), []);

    return (
        <ModalDialog minWidth="md">
            <DialogContent>
                {changes === undefined ? <LinearProgress /> : (
                    !changes ? "ERROR" : changes.map((b, i) => (
                        <Fragment key={i}>
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
                        </Fragment>
                    ))
                )}
            </DialogContent>
        </ModalDialog>
    );
}





async function fetchChangeNote(workshopId: string) {
    try {
        const html = await ipc.invoke(SteamIpc.GetChangeLog, workshopId);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        return [...doc.querySelectorAll("#profileBlock .workshopAnnouncement")].map((el) => ({
            time: el.querySelector(".headline")?.textContent.trim() ?? "",
            text: el.querySelector("p")?.innerHTML.trim().replace(/\\n/g, "\n") ?? "",
        }));
    } catch (e) {
        createBackgroundTask.error(localize("common.status.error"), e);
        return null;
    }
}

