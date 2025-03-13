import { CircularProgress, ColorPaletteProp, Input, List, ListItemButton, ListItemDecorator, Stack, Tooltip, Typography } from "@mui/joy";
import React, { JSX } from "react";
import FolderIcon from "@mui/icons-material/Folder";
import RimWorldIcon from "src/view/scripts/Components/Icons/RimWorld";
import SteamIcon from "src/view/scripts/Components/Icons/Steam";
import MainBody from "./MainBody";
import { formatCamelCase } from "@common/utils";
import { openUrl } from "../../utils";
import Localize from "@common/Localize";


export default function ModList() {
    const {
        selectedMod, setSelectedMod,
        sortedMods,
        isPending,
        problems,
    } = React.useContext(MainBody.Context);
    const [searchText, setSearchText] = React.useState("");
    // const [selectedElementRef, setSelectedElementRef] = React.useState<HTMLDivElement>();




    function LoadingElement() {
        return (
            <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
                <CircularProgress />
            </Stack>
        )
    }

    const Item = React.useCallback(React.memo(function ({ mod, isSelected, isActive, errorReport, wrongVersion, missingVersion }: {
        mod: ModInfo,
        isSelected: boolean,
        isActive: boolean,
        errorReport?: ModListErrorReport,
        wrongVersion: boolean,
        missingVersion: boolean,
    }) {
        const [isTooltipOpen, setTooltipOpen] = React.useState(false);
        // const { gameInfo } = React.useContext(GameInfoContext);

        let icon: JSX.Element, color: ColorPaletteProp;

        {
            switch (mod.type) {
                case "Steam": icon = <SteamIcon />; break;
                case "Local": icon = <FolderIcon />; break;
                case "DLC": icon = <RimWorldIcon />; break;
            }

            if (errorReport) color = "danger";
            else if (wrongVersion && mod.type !== "DLC") color = "warning";
            else if (missingVersion && mod.type !== "DLC") color = "warning";
            else color = "neutral";
        }


        const Element = (
            <ListItemButton
                className="mod-list-item"
                draggable
                selected={isSelected}
                onClick={() => setSelectedMod(mod)}
                onFocus={() => setSelectedMod(mod)}
                onDoubleClick={() => {
                    if (!isActive) invoke.activeMod(mod.about.packageId);
                    else invoke.disableMod(mod.about.packageId);
                }}
                color={color}
                variant={color !== "neutral" ? "soft" : undefined}
                onDragOver={(e) => e.preventDefault()}
                onDragStart={(e) => e.dataTransfer.setData("packageId", mod.about.packageId)}
                onDrop={(e) => {
                    const targetId = e.dataTransfer.getData("packageId") as PackageId || "";
                    if (!targetId) return;

                    const elem = e.currentTarget.closest(".mod-list-item");
                    if (!elem) return invoke.activeModAfter(targetId, mod.about.packageId);

                    const rect = elem.getBoundingClientRect();

                    if (e.pageY > rect.top + rect.height / 2)
                        invoke.activeModAfter(targetId, mod.about.packageId);
                    else
                        invoke.activeModBefore(targetId, mod.about.packageId);
                }}
            >
                <ListItemDecorator>{icon}</ListItemDecorator>
                <Typography color={color} noWrap title={mod.about.name}>{mod.about.name}</Typography>
            </ListItemButton>
        )

        // const wrongVersion = gameInfo ? mod.about. : undefined

        if (color === "neutral") return Element;

        // const anyReason = !!report || ;

        const ErrorReport = errorReport?.errors && (
            <Stack direction="row" spacing={2}>
                {Object.keys(errorReport.errors).map(key =>
                    <Stack key={key} spacing={1}>
                        <Typography color="danger" level="body-sm">{formatCamelCase(key)}</Typography>
                        <List size="sm">
                            {errorReport.errors[key as keyof typeof errorReport.errors]!.map(a => (
                                !("steamWorkshopUrl" in a)
                                    ? (
                                        <ListItemButton key={a.about.packageId} onClick={() => setSelectedMod(a)} >
                                            <Typography level="body-xs">{a.about.name} ({a.about.packageId})</Typography>
                                        </ListItemButton>
                                    ) : (
                                        <ListItemButton key={a.packageId} onClick={() => openUrl(a.steamWorkshopUrl)}>
                                            <Typography level="body-xs">{a.displayName} ({a.packageId})</Typography>
                                        </ListItemButton>
                                    )
                            ))}
                        </List>
                    </Stack>
                )}
            </Stack>
        )
        const WrongVersionReport = wrongVersion && mod.type !== "DLC" && (
            <Stack spacing={1}>
                <Typography color="warning" level="body-sm">Wrong Version</Typography>
                <Typography color="warning" level="body-sm" variant="soft">The mod does not support this version of the game. Possible problems.</Typography>
            </Stack>
        )
        const MissingVersionReport = missingVersion && mod.type !== "DLC" && (
            <Stack spacing={1}>
                <Typography color="warning" level="body-sm">Missing Version</Typography>
                <Typography color="warning" level="body-sm" variant="soft">The mod does not contain information about supported versions of the game.</Typography>
            </Stack>
        )

        return (
            <Tooltip
                arrow
                describeChild
                open={isTooltipOpen}
                onOpen={() => setTooltipOpen(true)}
                onClose={e => e.type != "blur" && setTooltipOpen(false)}

                title={
                    <Stack spacing={2}>
                        {ErrorReport}
                        {WrongVersionReport}
                        {MissingVersionReport}
                    </Stack>
                }
                variant="outlined"
            >
                {Element}
            </Tooltip>
        )
    }), []);


    const mapping = (isActive: boolean, mod: ModInfo) => <Item
        key={mod.about.packageId}
        mod={mod}
        isSelected={mod.about.packageId == selectedMod?.about.packageId}
        isActive={isActive}
        errorReport={problems?.modListErrors.find(report => mod.about.packageId == report.mod.about.packageId)}
        wrongVersion={problems?.wrongVersion.includes(mod) ?? false}
        missingVersion={problems?.missingModVersion.includes(mod) ?? false}
    />;
    const filterBySearch = (mod: ModInfo) => new RegExp(searchText, "i").test(mod.about.name);




    // Move By Arrows
    React.useEffect(() => {
        function keyDown(this: Window, ev: KeyboardEvent) {
            if (!sortedMods) return;

            let targetList = !selectedMod || sortedMods.actives.some(m => m.about.packageId == selectedMod.about.packageId) ? sortedMods.actives : sortedMods.unactives;

            let targetId = !selectedMod ? 0 : targetList.findIndex(m => m.about.packageId === selectedMod.about.packageId);

            switch (ev.code) {
                case "ArrowUp":
                    targetId--;
                    break;
                case "ArrowDown":
                    targetId++;
                    break;
                case "ArrowRight": case "ArrowLeft":
                    targetList = targetList == sortedMods.actives ? sortedMods.unactives : sortedMods.actives;
                    break;
                case "Enter":
                    if (selectedMod) {
                        if (targetList == sortedMods.actives) {
                            invoke.disableMod(selectedMod.about.packageId);
                        } else {
                            invoke.activeMod(selectedMod.about.packageId);
                        }
                    }
                    break;
                default: return;
            }

            if (targetId < 0) targetId = targetList.length - 1;
            else if (targetId >= targetList.length) targetId = 0;

            setSelectedMod(targetList.at(targetId));

            ev.preventDefault();
        }
        addEventListener("keydown", keyDown);
        return () => {
            removeEventListener("keydown", keyDown);
        }
    }, [sortedMods, selectedMod]);

    return (
        <Stack gap={1} width="40%">
            <Input
                placeholder={Localize("search")}
                value={searchText}
                onChange={e => setSearchText(e.currentTarget.value)}
            />
            <Stack
                direction="row"
                gap={1}
                flex={1}
                overflow="hidden"
                sx={{
                    // height:
                    "& .MuiList-root": {
                        overflowY: "auto",
                        overflowX: "hidden",
                        height: "100%",
                        width: "50%",
                    }
                }}
            >
                <List variant="outlined">
                    {isPending ? <LoadingElement /> : sortedMods?.unactives.filter(filterBySearch).map(mapping.bind({}, false))}
                </List>
                <List
                    variant="outlined"
                    color={problems?.modListErrors.length ? "danger" : void 0}
                >
                    {isPending ? <LoadingElement /> : sortedMods?.actives.filter(filterBySearch).map(mapping.bind({}, true))}
                </List>
            </Stack>
            {/* <Problems problems={problems} /> */}
        </Stack >
    )
}

// function Problems({ problems }: { problems: MainBodyContext["problems"] }) {
//     return (
//         <AccordionGroup sx={{ flex: 0 }}>
//             <Accordion>
//                 <AccordionSummary >
//                     Problems {problems.missingMods.length ? "(!)" : null}
//                     {/* Errors: {problems.errors.length} | Warns: {problems.warns.length} */}
//                 </AccordionSummary>
//                 <AccordionDetails>
//                     {/* // problems.status == "success"
//                         //     ? "No problems found! Nice build 😁"
//                         //     : */}
//                     <AccordionGroup
//                         sx={{
//                             flex: 0,
//                             [`& .${accordionDetailsClasses.content}`]: {
//                                 maxHeight: 200, overflowY: "auto"
//                             }
//                         }}
//                     >
//                         <Accordion disabled={!problems.missingMods.length}>
//                             <AccordionSummary color="warning">Missing Mods ({problems.missingMods.length})</AccordionSummary>
//                             <AccordionDetails>
//                                 <List>
//                                     {problems.missingMods.map(id =>
//                                         <ListItemButton key={id} onClick={() => {
//                                             clipboard.writeText(id);
//                                             AlertService.create({ text: "Copied to clipboard", lifeTime: null })
//                                         }}>
//                                             <Typography component="code" noWrap>{id}</Typography>
//                                         </ListItemButton>
//                                     )}
//                                 </List>
//                             </AccordionDetails>
//                         </Accordion>

//                         <Accordion disabled={!Object.keys(problems.modListErrors).length}>
//                             <AccordionSummary color="danger">Errors ({Object.keys(problems.modListErrors).length})</AccordionSummary>
//                             <AccordionDetails>
//                                 {/* <AccordionGroup>
//                                     {(function* () {
//                                         for (const report of problems.modListErrors) {
//                                             yield (
//                                                 <Accordion>
//                                                     <AccordionSummary>{report.mod.about.name} ({report.mod.about.packageId})</AccordionSummary>
//                                                     <AccordionDetails>
//                                                         <AccordionGroup>
//                                                             {Object.keys(report.errors).map(key =>
//                                                                 <Accordion key={key}>
//                                                                     <AccordionSummary>{key}</AccordionSummary>
//                                                                     <AccordionDetails>
//                                                                         <List>
//                                                                             {report.errors[key as keyof typeof report.errors]!.map(a => (
//                                                                                 <ListItem>{a.about.name} ({a.about.packageId})</ListItem>
//                                                                             ))}
//                                                                         </List>
//                                                                     </AccordionDetails>
//                                                                 </Accordion>
//                                                             )}
//                                                         </AccordionGroup>
//                                                     </AccordionDetails>
//                                                 </Accordion>
//                                             )
//                                         }
//                                     })()}
//                                 </AccordionGroup> */}
//                             </AccordionDetails>
//                         </Accordion>
//                     </AccordionGroup>
//                 </AccordionDetails>
//             </Accordion>
//         </AccordionGroup>
//     )
// }