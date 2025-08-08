import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, ButtonGroup, Sheet, Stack, Table, Typography } from "@mui/joy";
import ModSupportedVersions from "@Components/ModSupportedVersions";
import Localize from "@Common/Localize";
import { LocalModListStores } from "./Context/LocalModListContext";
import { Mod, Mod_ALL } from "@Classes/Mod";
import { openUrl } from "view/scripts/utils";
import { ModType } from "enums";

export default function ModInfo() {
    const selectedMod = LocalModListStores.selectedMod.use();


    return !selectedMod
        ? <ModChoiceScreen />
        : <Info mod={selectedMod} />
}


function ModChoiceScreen() {
    return (
        <Sheet variant="soft" sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: .25,
            p: 3,
            userSelect: "none"
        }}>
            <Typography level="h1" textAlign={"center"} letterSpacing={8}>{Localize("modChoiceScreenText")}</Typography>
        </Sheet>
    )
}



function Info({ mod }: { mod: Mod_ALL }) {
    return (
        <Stack gap={1} flex={1} sx={t => ({
            overflowY: "auto",
            overflowX: "hidden",
            color: t.palette.text.primary,
        })}>
            {mod.previewPath && <Box component="img"
                src={mod.previewPath}
                width="100%"
                maxHeight={150}
                draggable={false}
                sx={{
                    objectFit: "contain"
                }}
            />}
            <Typography level="h3">{mod.about.name}</Typography>
            <InfoTable mod={mod} />
            <Actions mod={mod} />
            <AccordionGroup variant="outlined" sx={{ flexGrow: 0, "&:empty": { display: "none" } }}>
                <Description description={mod.about.description} />
                {/* <ModTags mod={mod} /> */}
            </AccordionGroup>
        </Stack>
    )
}

function ModDataRow({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <tr>
            <td width={150}><Typography level="body-sm">{label}</Typography></td>
            <td>{value}</td>
        </tr>
    )
}

function InfoTable({ mod }: { mod: Mod_ALL }) {
    return (
        <Table>
            <tbody>
                <ModDataRow label="PackageId" value={<Typography title={mod.about.packageId} noWrap>{mod.about.packageId}</Typography>} />
                {mod.about.modVersion && <ModDataRow label={Localize("version")} value={mod.about.modVersion} />}
                <ModDataRow label={Localize("authors")} value={mod.about.author} />
                <SupportedVersions mod={mod} />
            </tbody>
        </Table>
    )
}

function Actions({ mod }: { mod: Mod_ALL }) {
    mod.useEnablingSub();

    return (
        <Stack
            gap={1}
        >
            <ButtonGroup buttonFlex="1">
                <Button color="neutral" variant="outlined" onClick={() => mod.toggleState()}>{mod.isActive() ? Localize("disable") : Localize("enable")}</Button>
                {![ModType.Steam, ModType.DLC].includes(mod.type) && <Button color="danger" variant="outlined" onClick={() => { }} disabled>{Localize("delete")}</Button>}
                {[ModType.Steam].includes(mod.type) && <Button color="danger" variant="outlined" onClick={() => { }} disabled>{Localize("unsubscribe")}</Button>}
            </ButtonGroup>
            <ButtonGroup buttonFlex="1" color="primary" variant="outlined">
                <Button onClick={() => mod.openDir()}>{Localize("openDirectory")}</Button>
                {mod.isSteam() && <Button onClick={() => mod.openInSteam()}>{Localize("openInSteam")}</Button>}
                {mod.isGit() && <Button onClick={() => mod.openInGit()}>{Localize("openInGit")}</Button>}
                {mod.about.url && <Button onClick={() => openUrl(mod.about.url!)}>{Localize("openSource")}</Button>}
            </ButtonGroup>
        </Stack>
    )
}

function SupportedVersions({ mod }: { mod: Mod_ALL }) {
    return mod.about.supportedVersions && (
        <ModDataRow
            label={Localize("supportedVersions")}
            value={
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ userSelect: "none" }}>
                    <ModSupportedVersions mod={mod} />
                </Stack>
            }
        />
    )
}

function Description({ description }: { description: string | undefined }) {
    return description && (
        <Accordion>
            <AccordionSummary>{Localize("description")}</AccordionSummary>
            <AccordionDetails
                sx={{
                    whiteSpace: "break-spaces"
                }}
            >{description}</AccordionDetails>
        </Accordion>
    );
}

// const ModTags = React.memo(function ModTags({ mod }: { mod: Mod }) {
//     return (
//         <Accordion>
//             <AccordionSummary>{Localize("tags")}</AccordionSummary>
//             <AccordionDetails>
//                 <ModTagList tags={mod.tags} packageId={mod.about.packageId} />
//             </AccordionDetails>
//         </Accordion>
//     )
// }, (p, n) => p.mod.dirPath === n.mod.dirPath && p.mod.tags === n.mod.tags);
