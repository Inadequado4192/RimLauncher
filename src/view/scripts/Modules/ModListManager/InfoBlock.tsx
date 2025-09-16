import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Chip, Sheet, Stack, Table, Typography } from "@mui/joy";
import Localize from "@Common/Localize";
import { __ModListStores__ } from "./__ModListStore__";
import ModTagList from "@Renderer/scripts/Components/ModTagList";
import { GameInfoStore } from "@Renderer/scripts/Stores";
import { Store, StoreCompares, StoreCompareType } from "@Renderer/scripts/Stores/store";
import { ModActions } from "@Renderer/scripts/Components/ModActions";
import { Mod } from "@Renderer/scripts/Classes/Mod";
import ModTag from "@Renderer/scripts/Components/ModTag";
import Tag from "@Renderer/scripts/Classes/Tag";

export default function InfoBlock() {
    const selectedModsLength = __ModListStores__.selectedMods.use(m => m.length);

    if (selectedModsLength == 0) return <ModChoiceScreen />;
    else if (selectedModsLength == 1) return <ModInfo.MemoInfo />
    else return <ModsInfo.Root />;
}


function ModChoiceScreen() {
    return (
        <Sheet variant="soft" sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: .25,
            userSelect: "none"
        }}>
            <Typography level="h1" textAlign={"center"} letterSpacing={8}>{Localize("info.modChoiceScreenText")}</Typography>
        </Sheet>
    )
}


namespace ModInfo {
    export const MemoInfo = React.memo(function MemoInfo() {
        React.useEffect(() => {
            function callback() {
                const selectedMods = __ModListStores__.selectedMods.get();
                if (selectedMods.length == 1) modStore.set(selectedMods[0]!);
                else modStore.set(undefined!);
                return () => modStore.set(undefined!);
            }
            callback();
            return __ModListStores__.selectedMods.subscribe(callback);
        }, []);

        if (modStore.use(m => !m)) return null;

        return (
            <Stack
                gap={1}
                flex={1}
                sx={{
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <Preview />
                <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                    <Label />
                    <Actions />
                </Stack>
                <InfoTable />
                <Group />
                <Description />
            </Stack>
        )
    });

    const modStore = new Store<Mod>({ value: undefined! });


    function ModDataRow({ label, value, title }: { label: string, value: React.ReactNode, title?: string }) {
        return (
            <tr>
                <td width={150}>
                    <span
                        style={{
                            color: "var(--joy-palette-text-tertiary)"
                        }}
                    >{label}</span>
                </td>
                <td title={title}>{value}</td>
            </tr>
        )
    }

    const Preview = React.memo(function Preview() {
        const imgRef = React.useRef<HTMLImageElement>(null);

        React.useEffect(() => {
            // Performance Experement
            function changePreview() {
                if (!imgRef.current) return;
                const p = modStore.get()?.previewPath;
                if (p) {
                    imgRef.current.style.display = "block";
                    imgRef.current.src = p;
                } else {
                    imgRef.current.style.display = "none";
                }
            }

            changePreview();

            return modStore.subscribe(changePreview);
        }, [imgRef]);

        return (
            <Box component="img"
                ref={imgRef}
                width="100%"
                maxHeight={150}
                draggable={false}
                sx={{
                    objectFit: "contain"
                }}
            />
        )
    });

    const Label = React.memo(function Label() {
        const mod = modStore.use();

        return <h4 style={{ margin: 0 }}>{mod.about.name}</h4>
    });

    const InfoTable = React.memo(function InfoTable() {
        const Row_PackageId = React.useCallback(function Row_PackageId() {
            const packageId = modStore.use(m => m?.about.packageId);
            return <ModDataRow label="PackageId" value={packageId} title={packageId} />
        }, []);
        const Row_Version = React.useCallback(function Row_Version() {
            const modVersion = modStore.use(m => m?.about.modVersion);
            return modVersion && <ModDataRow label={Localize("common.version")} value={modVersion} />
        }, []);
        const Row_Authors = React.useCallback(function Row_Authors() {
            const authors = modStore.use(m => m?.about.author);
            return <ModDataRow label={Localize("info.authors")} value={authors} />
        }, []);
        const Row_SupportedVersions = React.useCallback(function Row_SupportedVersions() {
            const supportedVersions = modStore.use(m => (m?.about.supportedVersions ?? []).sort(), StoreCompareType.PrimitiveArray);

            const MemoChip = React.useCallback(React.memo(function MemoChip({ v }: { v: string }) {
                const color = v == GameInfoStore.get().gameVersionShort ? "success" : "danger"
                return (
                    <span
                        style={{
                            fontSize: 10,
                            display: "flex",
                            color: `var(--joy-palette-${color}-outlinedColor)`,
                            background: "var(--joy-palette-background-surface)",
                            paddingLeft: 16,
                            paddingRight: 16,
                            borderRadius: "1.5rem",
                            border: "1px solid",
                            borderColor: `var(--joy-palette-${color}-outlinedBorder)`
                        }}
                    >{v}</span>
                )
            }), []);

            return (
                <ModDataRow
                    label={Localize("mods.supportedVersions")}
                    value={
                        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ userSelect: "none" }}>
                            {[...supportedVersions].reverse().map(v => <MemoChip key={v} v={v} />)}
                        </Stack>
                    }
                />
            )
        }, []);

        return (
            <Table
                size="sm"
                sx={{
                    "--unstable_TableCell-height": 16
                }}
            >
                <tbody>
                    <Row_PackageId />
                    <Row_Version />
                    <Row_Authors />
                    <Row_SupportedVersions />
                </tbody>
            </Table>
        )
    });

    const Actions = React.memo(function Actions() {
        const mod = modStore.use();

        if (!mod) return null;

        return <ModActions mod={mod} />;
    });




    const Group = React.memo(function Group() {
        return (
            <AccordionGroup size="sm" variant="outlined" sx={{ flexGrow: 0, "&:empty": { display: "none" } }}>
                <ModTags />
            </AccordionGroup>
        )
    });

    const Description = React.memo(function Description() {
        // const [expanded, setExpanded] = React.useState(false);
        // const Container = React.useCallback(function ModTagListContainer() {
        //     return modStore.use()?.about.description;
        // }, [])

        // return (
        //     <Accordion expanded={expanded} onChange={(ev, ex) => setExpanded(ex)}>
        //         <AccordionSummary>{Localize("info.description")}</AccordionSummary>
        //         <AccordionDetails sx={{ whiteSpace: "break-spaces" }}>
        //             {expanded && <Container />}
        //         </AccordionDetails>
        //     </Accordion >
        // );
        return <p style={{ fontSize: ".8em", margin: 0 }}>{modStore.use()?.about.description}</p>;
    });

    const ModTags = React.memo(function ModTags() {
        const [expanded, setExpanded] = React.useState(false);
        const Container = React.useCallback(function ModTagListContainer() {
            const selectedMod = modStore.use();
            return selectedMod && <ModTagList mod={selectedMod} />
        }, [])

        return (
            <Accordion expanded={expanded} onChange={(ev, ex) => setExpanded(ex)}>
                <AccordionSummary>{Localize("mods.tags")}</AccordionSummary>
                <AccordionDetails>
                    {expanded && <Container />}
                </AccordionDetails>
            </Accordion>
        )
    });

}
namespace ModsInfo {
    export const Root = React.memo(function Root() {
        return (
            <Stack spacing={1}>
                <Count />
                <Labels />
                <Tags />
            </Stack>
        )
    });

    function Count() {
        const count = __ModListStores__.selectedMods.use(mods => mods.length);
        return (
            <Typography variant="soft" p={.5} level="body-sm">Count: {count}</Typography>
        )
    }
    function Labels() {
        const labels = __ModListStores__.selectedMods.use(mods => mods.map(m => m.about.name), StoreCompareType.PrimitiveArray);
        return (
            <Typography variant="soft" p={.5} level="body-xs" noWrap>{labels.join(", ")}</Typography>
        )
    }
    function Tags() {
        const tags = __ModListStores__.tags.use();
        const sortedTags = __ModListStores__.selectedMods.use(mods => {
            return tags.reduce((r, c) => {
                if (mods.every(m => c.packageIds.includes(m.about.packageId))) {
                    r.shared.push(c);
                } else {
                    r.notShared.push(c);
                }
                return r;
            }, { shared: [], notShared: [] } as { shared: Tag[], notShared: Tag[] });
        }, (p, n) => {
            return (
                StoreCompares.primitiveArraysEqual(p.shared, n.shared) &&
                StoreCompares.primitiveArraysEqual(p.notShared, n.notShared)
            )
        });


        function add(tag: Tag) {
            const set = new Set(tag.packageIds);
            __ModListStores__.selectedMods.get().forEach(m => set.add(m.about.packageId));
            $invoke.updateTag(tag.name, "packageIds", [...set]);
        }
        function remove(tag: Tag) {
            const set = new Set(tag.packageIds);
            __ModListStores__.selectedMods.get().forEach(m => set.delete(m.about.packageId));
            $invoke.updateTag(tag.name, "packageIds", [...set]);
        }


        return (
            <Stack spacing={1}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {sortedTags.shared.map(t => <ModTag key={t.name} tag={t} onClick={() => remove(t)} />)}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ opacity: .5 }}>
                    {sortedTags.notShared.map(t => <ModTag key={t.name} tag={t} onClick={() => add(t)} />)}
                </Stack>
            </Stack>
        )
    }
}
