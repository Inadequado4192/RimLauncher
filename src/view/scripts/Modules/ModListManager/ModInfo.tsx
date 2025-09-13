import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, Chip, Sheet, Stack, Table, Typography } from "@mui/joy";
import Localize from "@Common/Localize";
import { __ModListStores__ } from "./__ModListStore__";
import { ModType } from "enums";
import ModTagList from "@Renderer/scripts/Components/ModTagList";
import { GameInfoStore } from "@Renderer/scripts/Stores";
import { StoreCompareType } from "@Renderer/scripts/Stores/store";
import { ConfirmService } from "@Renderer/scripts/Services/Confirm";

export default function ModInfo() {
    const selectedMod = __ModListStores__.selectedMod.use();

    return !selectedMod
        ? <ModChoiceScreen />
        : <MemoInfo />
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


const MemoInfo = React.memo(() => <Info />);
function Info() {
    return (
        <Stack
            gap={1}
            flex={1}
            sx={{
                overflowY: "auto",
                overflowX: "hidden",
            }}
        >
            <Info.Preview />
            <Info.Label />
            <Info.InfoTable />
            <Info.Actions />
            <Info.Group />
        </Stack>
    )
}


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

Info.Preview = React.memo(function Preview() {
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
        // Performance Experement
        function changePreview() {
            if (!imgRef.current) return;
            const p = __ModListStores__.selectedMod.get()?.previewPath;
            if (p) {
                imgRef.current.style.display = "block";
                imgRef.current.src = p;
            } else {
                imgRef.current.style.display = "none";
            }
        }

        changePreview();

        return __ModListStores__.selectedMod.subscribe(changePreview);
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

Info.Label = React.memo(function Label() {
    const mod = __ModListStores__.selectedMod.use()!;

    return <h3>{mod.about.name}</h3>
});

Info.InfoTable = React.memo(function InfoTable() {
    const Row_PackageId = React.useCallback(function Row_PackageId() {
        const packageId = __ModListStores__.selectedMod.use(m => m?.about.packageId);
        return <ModDataRow label="PackageId" value={packageId} title={packageId} />
    }, []);
    const Row_Version = React.useCallback(function Row_Version() {
        const modVersion = __ModListStores__.selectedMod.use(m => m?.about.modVersion);
        return modVersion && <ModDataRow label={Localize("common.version")} value={modVersion} />
    }, []);
    const Row_Authors = React.useCallback(function Row_Authors() {
        const authors = __ModListStores__.selectedMod.use(m => m?.about.author);
        return <ModDataRow label={Localize("info.authors")} value={authors} />
    }, []);
    const Row_SupportedVersions = React.useCallback(function Row_SupportedVersions() {
        const supportedVersions = __ModListStores__.selectedMod.use(m => [...m?.about.supportedVersions ?? []].sort(), StoreCompareType.PrimitiveArray);
        const gameVersionShort = GameInfoStore.use(gi => gi.gameVersionShort);

        const MemoChip = React.useCallback(React.memo(function MemoChip({ v }: { v: string }) {
            return (
                <Chip
                    size="sm"
                    sx={{ px: 2 }}
                    variant="outlined"
                    color={v == gameVersionShort ? "success" : "danger"}
                >{v}</Chip>
            )
        }), [gameVersionShort]);

        return (
            <ModDataRow
                label={Localize("mods.supportedVersions")}
                value={
                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ userSelect: "none" }}>
                        {[...supportedVersions ?? []].reverse().map(v => <MemoChip key={v} v={v} />)}
                    </Stack>
                }
            />
        )
    }, []);

    return (
        <Table>
            <tbody>
                <Row_PackageId />
                <Row_Version />
                <Row_Authors />
                <Row_SupportedVersions />
            </tbody>
        </Table>
    )
})

Info.Actions = React.memo(function Actions() {
    const ToggleButton = React.useCallback(function ToggleButton() {
        const mod = __ModListStores__.selectedMod.use()!;
        mod.useEnablingSub();
        return <Button color="neutral" onClick={() => mod.toggleState()}>{mod.isActive() ? Localize("actions.disable") : Localize("actions.enable")}</Button>
    }, []);
    const DeleteButton = React.useCallback(function DeleteButton() {
        const display = __ModListStores__.selectedMod.use(mod => [ModType.Local, ModType.Git].includes(mod?.type!));
        if (!display) return null;
        return (
            <Button
                color="danger"
                onClick={async () => {
                    const mod = __ModListStores__.selectedMod.get();
                    if (mod?.isLocal() && await ConfirmService.create({}).endPromise) mod.delete();
                }}
            >{Localize("actions.delete")}</Button>
        );
    }, []);
    const UnsubscribeButton = React.useCallback(function UnsubscribeButton() {
        const display = __ModListStores__.selectedMod.use(mod => [ModType.Steam].includes(mod?.type!));
        return display && <Button color="danger" onClick={() => {
            const mod = __ModListStores__.selectedMod.get();
            if (mod?.isSteam()) mod.unsubscribe();
        }} disabled>{Localize("common.unsubscribe")}</Button>
    }, []);


    const OpenDirButton = React.useCallback(function OpenDirButton() {
        return <Button color="primary" onClick={() => __ModListStores__.selectedMod.get()?.openDir()}>{Localize("actions.openDirectory")}</Button>
    }, []);
    const OpenInSteamButton = React.useCallback(function OpenInSteamButton() {
        const display = __ModListStores__.selectedMod.use(mod => !!mod?.isSteam());
        return display && <Button color="primary" onClick={() => {
            const mod = __ModListStores__.selectedMod.get();
            if (mod?.isSteam()) mod.openInSteam();
        }}>{Localize("actions.openInSteam")}</Button>
    }, []);
    const OpenInGitButton = React.useCallback(function OpenInGitButton() {
        const display = __ModListStores__.selectedMod.use(mod => !!mod?.isGit());
        return display && <Button color="primary" onClick={() => {
            const mod = __ModListStores__.selectedMod.get();
            if (mod?.isGit()) mod.openInGit();
        }}>{Localize("actions.openInGit")}</Button>
    }, []);
    const OpenSourceButton = React.useCallback(function OpenSourceButton() {
        const display = __ModListStores__.selectedMod.use(mod => !!mod?.hasSourceUrl());
        return display && <Button color="primary" onClick={() => {
            const mod = __ModListStores__.selectedMod.get();
            if (mod?.hasSourceUrl()) mod.openSource();
        }}>{Localize("actions.openSource")}</Button>
    }, []);


    return (
        <Stack
            gap={1}
            sx={{
                "& button": {
                    flexGrow: 1
                }
            }}
        >
            <Stack spacing={1} useFlexGap direction="row" flexWrap="wrap">
                <ToggleButton />
                <DeleteButton />
                <UnsubscribeButton />
            </Stack>
            <Stack spacing={1} useFlexGap direction="row" flexWrap="wrap">
                <OpenDirButton />
                <OpenInSteamButton />
                <OpenInGitButton />
                <OpenSourceButton />
            </Stack>
        </Stack>
    )
})




Info.Group = React.memo(function Group() {
    return (
        <AccordionGroup variant="outlined" sx={{ flexGrow: 0, "&:empty": { display: "none" } }}>
            <Info.Description />
            <Info.ModTags />
        </AccordionGroup>
    )
});

Info.Description = React.memo(function Description() {
    const [expanded, setExpanded] = React.useState(false);
    const Container = React.useCallback(function ModTagListContainer() {
        return __ModListStores__.selectedMod.use()?.about.description;
    }, [])

    return (
        <Accordion expanded={expanded} onChange={(ev, ex) => setExpanded(ex)}>
            <AccordionSummary>{Localize("info.description")}</AccordionSummary>
            <AccordionDetails sx={{ whiteSpace: "break-spaces" }}>
                {expanded && <Container />}
            </AccordionDetails>
        </Accordion >
    );
});

Info.ModTags = React.memo(function ModTags() {
    const [expanded, setExpanded] = React.useState(false);
    const Container = React.useCallback(function ModTagListContainer() {
        const selectedMod = __ModListStores__.selectedMod.use();
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
