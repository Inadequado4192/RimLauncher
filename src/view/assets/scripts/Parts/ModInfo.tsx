import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, Chip, Sheet, Stack, Table, Typography } from "@mui/joy";
import MainBody from "./MainBody";
import { GameInfoContext } from "@Context/GameInfoContext";
import { LocalContext } from "@Context/LocalContext";
import { openUrl } from "../utils";
import ModSupportedVersions from "../Components/ModSupportedVersions";

export default function ModInfo() {
    const { selectedMod } = React.useContext(MainBody.Context);

    return !selectedMod
        ? <ModChoiceScreen />
        : <Info mod={selectedMod} />
}


function ModChoiceScreen() {
    const { Localize } = React.useContext(LocalContext);
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



function Info({ mod }: { mod: ModInfo }) {
    const { activeMods } = React.useContext(MainBody.Context);
    const { Localize } = React.useContext(LocalContext);

    const isActive = activeMods?.includes(mod?.about.packageId);

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
            <Table>
                <tbody>
                    <ModData label="PackageId" value={<Typography title={mod.about.packageId} noWrap>{mod.about.packageId}</Typography>} />
                    <ModData label={Localize("version")} value={mod.about.modVersion} />
                    <ModData label={Localize("authors")} value={mod.about.author} />
                    <SupportedVersions mod={mod} />
                </tbody>
            </Table>
            <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
                sx={{ "& > button": { flexGrow: 1, whiteSpace: "nowrap" } }}
            >
                <Button color="primary" variant="outlined" onClick={() => (isActive ? invoke.disableMod : invoke.activeMod)(mod.about.packageId)}>{isActive ? Localize("toDisableMod") : Localize("toActiveMod")}</Button>
                <Button color="primary" variant="outlined" onClick={() => invoke.openPath(mod.dirPath)}>{Localize("openDirectory")}</Button>
                {mod.steamId && <Button color="primary" variant="outlined" onClick={() => openUrl(`https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.steamId}`)}>{Localize("openInSteam")}</Button>}
            </Stack>
            <Description mod={mod} />
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


function SupportedVersions({ mod }: { mod: ModInfo }) {
    const { Localize } = React.useContext(LocalContext);
    const { gameInfo } = React.useContext(GameInfoContext);

    return mod.about.supportedVersions && (
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

function Description({ mod }: { mod: ModInfo }) {
    const { Localize } = React.useContext(LocalContext);
    return mod.about.description && (
        <AccordionGroup variant="outlined" sx={{ flexGrow: 0 }}>
            <Accordion>
                <AccordionSummary>{Localize("description")}</AccordionSummary>
                <AccordionDetails
                    sx={{
                        whiteSpace: "break-spaces"
                    }}
                >{mod.about.description}</AccordionDetails>
            </Accordion>
        </AccordionGroup>
    );
}