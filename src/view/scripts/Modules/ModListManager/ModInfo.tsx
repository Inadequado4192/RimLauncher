import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, Chip, Sheet, Stack, Table, Typography } from "@mui/joy";
import ModListManager from ".";
import { GameInfoContext } from "src/view/scripts/Context/GameInfoContext";
import ModSupportedVersions from "src/view/scripts/Components/ModSupportedVersions";
import { openUrl } from "../../utils";
import Localize from "@Common/Localize";
import { LocalModListContext } from "./Context/LocalModListContext";
import { Mod } from "../../Classes/Mod";
import ModTagList from "@Components/ModTagList";

export default function ModInfo() {
    const { selectedMod } = React.useContext(LocalModListContext);

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



function Info({ mod }: { mod: Mod }) {
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
            <Typography level="h3">{mod.name}</Typography>
            <Table>
                <tbody>
                    <ModData label="PackageId" value={<Typography title={mod.packageId} noWrap>{mod.packageId}</Typography>} />
                    {mod.modVersion && <ModData label={Localize("version")} value={mod.modVersion} />}
                    <ModData label={Localize("authors")} value={mod.author} />
                    <SupportedVersions mod={mod} />
                </tbody>
            </Table>
            <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
                sx={{ "& > button": { flexGrow: 1, whiteSpace: "nowrap" } }}
            >
                <Button color="primary" variant="outlined" onClick={() => mod.toggleState()}>{mod.isActive() ? Localize("disable") : Localize("enable")}</Button>
                <Button color="primary" variant="outlined" onClick={() => mod.openDir()}>{Localize("openDirectory")}</Button>
                {mod.steamId && <Button color="primary" variant="outlined" onClick={() => mod.openInSteam()}>{Localize("openInSteam")}</Button>}
            </Stack>
            <Description mod={mod} />
            <AccordionGroup variant="outlined" sx={{ flexGrow: 0 }}>
                <Accordion>
                    <AccordionSummary>{Localize("tags")}</AccordionSummary>
                    <AccordionDetails>
                        <ModTagList tags={mod.tags} packageId={mod.packageId} />
                    </AccordionDetails>
                </Accordion>
            </AccordionGroup>
        </Stack>
    )
}

function ModData({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <tr>
            <td width={150}><Typography level="body-sm">{label}</Typography></td>
            <td>{value}</td>
        </tr>
    )
}


function SupportedVersions({ mod }: { mod: Mod }) {
    const { gameInfo } = React.useContext(GameInfoContext);

    return mod.supportedVersions && (
        <ModData
            label={Localize("supportedVersions")}
            value={
                <Stack direction="row" gap={1} flexWrap="wrap" sx={{ userSelect: "none" }}>
                    <ModSupportedVersions mod={mod} />
                </Stack>
            }
        />
    )
}

function Description({ mod }: { mod: Mod }) {
    return mod.description && (
        <AccordionGroup variant="outlined" sx={{ flexGrow: 0 }}>
            <Accordion>
                <AccordionSummary>{Localize("description")}</AccordionSummary>
                <AccordionDetails
                    sx={{
                        whiteSpace: "break-spaces"
                    }}
                >{mod.description}</AccordionDetails>
            </Accordion>
        </AccordionGroup>
    );
}