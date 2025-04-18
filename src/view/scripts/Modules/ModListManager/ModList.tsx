import { Box, Button, ButtonGroup, Chip, CircularProgress, ColorPaletteProp, Divider, IconButton, Input, List, ListItem, ListItemButton, ListItemDecorator, Stack, Tooltip, Typography } from "@mui/joy";
import React, { JSX } from "react";
import FolderIcon from "@mui/icons-material/Folder";
import RimWorldIcon from "src/view/scripts/Components/Icons/RimWorld";
import SteamIcon from "src/view/scripts/Components/Icons/Steam";
import { openUrl } from "../../utils";
import Localize from "@Common/Localize";
import { LocalModListContext } from "./Context/LocalModListContext";
import { Mod, ModErrorType } from "../../Classes/Mod";
import CloseIcon from '@mui/icons-material/Close';
import ModTagList from "@Components/ModTagList";
import { TagsVisibilityContext } from "./Context/TagsVisibilityContext";
import { useInView } from "react-intersection-observer";
import Steam from "src/view/scripts/Components/Icons/Steam";

const modListItemClass = "mod-list-item";

export default function ModList() {
    const {
        modList,
        selectedMod,
        setSelectedMod,
        lastSelectedL_Path, lastSelectedR_Path,
    } = React.useContext(LocalModListContext);
    const { tagsV } = React.useContext(TagsVisibilityContext);
    const [searchText, setSearchText] = React.useState("");

    const [isOpenModTooltip, setModTooltip] = React.useState<Parameters<typeof ModTooltip>[0]["data"]>();

    // const selectedElementRef = React.useRef<null | HTMLLIElement>(null);

    useKeySelectEvents();



    function LoadingElement() {
        return (
            <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
                <CircularProgress />
            </Stack>
        )
    }

    const Item = React.useCallback(React.memo(function ({ mod, lastSelected, isSelected, errorType, show }: {
        mod: Mod,
        lastSelected: boolean,
        isSelected: boolean,
        errorType: ModErrorType,
        show: boolean
    }) {
        // console.log("[ITEM]");
        const elemRef = React.useRef<HTMLLIElement>(null);

        const { ref, inView } = useInView({ threshold: 0, });

        React.useEffect(() => {
            if (isSelected) {
                elemRef.current?.focus();
            }
        }, [isSelected]);


        const icon: JSX.Element = React.useMemo(() => {
            switch (mod.type) {
                case "Steam": return <SteamIcon />;
                case "Local": return <FolderIcon />;
                case "DLC": return <RimWorldIcon />;
            }
        }, [mod.type]);
        const color: ColorPaletteProp = React.useMemo(() => {
            if (errorType == 2) return "danger";
            else if (errorType == 1) return "warning";
            else return "neutral";
        }, [errorType]);

        if (!show) return null;

        const height = 36;

        return (
            <ListItem
                className={modListItemClass}
                data-mod-path={mod.dirPath}
                ref={e => ref(elemRef.current = e)}
                sx={t => ({
                    bgcolor: lastSelected ? t.palette.neutral.plainHoverBg : void 0,
                    height,
                    transition: ".2s",
                    opacity: inView ? 1 : 0
                })}
                tabIndex={1}
            >
                {
                    inView && (
                        <ListItemButton
                            draggable
                            selected={isSelected}
                            color={color}
                            variant={color !== "neutral" ? "soft" : undefined}

                            onContextMenu={() => setModTooltip({ pacageId: mod.packageId, anchorEl: elemRef.current! })}
                            onMouseEnter={() => errorType && setModTooltip({ pacageId: mod.packageId, anchorEl: elemRef.current! })}
                            onMouseLeave={(e) => {
                                if (
                                    e.relatedTarget instanceof HTMLElement &&
                                    (
                                        e.relatedTarget.classList.contains("MuiTooltip-root") ||
                                        e.relatedTarget.classList.contains("MuiTooltip-arrow")
                                    )
                                ) return;
                                setModTooltip(undefined);
                            }}

                            onDoubleClick={() => mod.toggleState()}
                            onClick={() => setSelectedMod(mod)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragStart={(e) => e.dataTransfer.setData("packageId", mod.packageId)}
                            onDrop={(e) => {
                                const targetId = e.dataTransfer.getData("packageId") as PackageId || "";
                                if (!targetId) return;

                                const elem = e.currentTarget.closest(`.${modListItemClass}`);
                                if (!elem) return invoke.activeModAfter(targetId, mod.packageId);

                                const rect = elem.getBoundingClientRect();

                                if (e.pageY > rect.top + rect.height / 2)
                                    invoke.activeModAfter(targetId, mod.packageId);
                                else
                                    invoke.activeModBefore(targetId, mod.packageId);
                            }}
                            sx={{ border: "none" }}
                        >
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0, bottom: 0,
                                    left: 0, right: 0,
                                    background: `linear-gradient(90deg, transparent 50%, ${mod.tags.map(t => t.color).join(", ")})`
                                }}
                            />
                            <ListItemDecorator>{icon}</ListItemDecorator>
                            <Typography
                                color={color}
                                noWrap
                                title={mod.name}
                                sx={{ zIndex: 1 }}
                            >{mod.name}</Typography>
                        </ListItemButton>
                    )
                }
            </ListItem>
        )
    }), []);

    const errors = React.useMemo(() => {
        const e = {} as Record<PackageId, ModErrorType>;
        for (const m of modList.mods) e[m.packageId] = m.getErrorType();
        return e;
    }, [modList.mods]);

    const mapping = React.useCallback((mod: Mod, i: number) => <Item
        key={mod.dirPath}
        mod={mod}
        lastSelected={lastSelectedL_Path == mod.dirPath || lastSelectedR_Path == mod.dirPath}
        isSelected={(selectedMod?.dirPath == mod.dirPath)}
        errorType={errors[mod.packageId]}
        show={
            mod.name.toLowerCase().includes(searchText.toLowerCase()) &&
            (!tagsV.size || mod.tags.some(t => tagsV.has(t.name)))
        }
    />, [selectedMod, searchText, errors, tagsV, lastSelectedL_Path, lastSelectedR_Path]);


    const unalist = React.useMemo(() => modList.unactives.map(mapping), [modList.unactives, mapping]);
    const alist = React.useMemo(() => modList.actives.map(mapping), [modList.actives, mapping]);

    return (
        <Stack gap={1} width="40%">
            <Input
                placeholder={Localize("search")}
                value={searchText}
                onChange={e => setSearchText(e.currentTarget.value)}
                endDecorator={<IconButton onClick={() => setSearchText("")} sx={{ borderRadius: "50%" }}><CloseIcon /></IconButton>}
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
                <List variant="outlined" id="list-unactive">
                    {!modList.isLoaded ? <LoadingElement /> : unalist}
                </List>
                <List variant="outlined" id="list-active" color={modList.errorType == ModErrorType.Error ? "danger" : modList.errorType == ModErrorType.Warn ? "warning" : undefined}>
                    {!modList.isLoaded ? <LoadingElement /> : alist}
                </List>
            </Stack>

            <ModTooltip
                data={isOpenModTooltip}
                onClose={e => e.type != "blur" && setModTooltip(undefined)}
            />
        </Stack >
    )
}




function useKeySelectEvents() {
    const {
        modList,
        selectedMod, setSelectedMod,
        lastSelectedL_Path, lastSelectedR_Path,
    } = React.useContext(LocalModListContext);

    // Move By Arrows
    React.useEffect(() => {
        function keyDown(this: Window, ev: KeyboardEvent) {
            if (this.document.getElementById("root")?.hasAttribute("aria-hidden") || document.activeElement?.tagName == "INPUT") return;



            const elements = {
                unactives: [...this.document.querySelectorAll("#list-unactive > li")],
                actives: [...this.document.querySelectorAll("#list-active > li")],
            };
            // const element = elements.values().find(elem => elem.getAttribute("data-mod-path") == selectedMod?.dirPath) ?? elements.item(0);

            const isActive = selectedMod?.isActive() ?? false;
            const currentList = isActive ? elements.actives : elements.unactives;

            const currentIndex = currentList.findIndex(elem => elem.getAttribute("data-mod-path") == selectedMod?.dirPath)
            
            switch (ev.code) {
                case "KeyW":
                case "ArrowUp":
                    {
                        ev.preventDefault();
                        let targetIndex = currentIndex - 1;
                        if (targetIndex < 0) targetIndex = currentList.length - 1;
                        else if (targetIndex >= currentList.length) targetIndex = 0;

                        const tPath = currentList[targetIndex]?.getAttribute("data-mod-path");
                        if (tPath) setSelectedMod(tPath);
                    }
                    return;

                case "KeyS":
                case "ArrowDown":
                    {
                        ev.preventDefault();
                        let targetIndex = currentIndex + 1;
                        if (targetIndex < 0) targetIndex = currentList.length - 1;
                        else if (targetIndex >= currentList.length) targetIndex = 0;

                        const tPath = currentList[targetIndex]?.getAttribute("data-mod-path");
                        if (tPath) setSelectedMod(tPath);
                    }
                    return;

                case "KeyA": case "KeyD":
                case "ArrowRight": case "ArrowLeft":
                    ev.preventDefault();
                    if (isActive) {
                        if (lastSelectedL_Path) {
                            setSelectedMod(lastSelectedL_Path);
                        } else {
                            const tPath = elements.unactives[0]?.getAttribute("data-mod-path");
                            if (tPath) setSelectedMod(tPath);
                        }
                    } else {
                        if (lastSelectedR_Path) {
                            setSelectedMod(lastSelectedR_Path);
                        } else {
                            const tPath = elements.actives[0]?.getAttribute("data-mod-path");
                            if (tPath) setSelectedMod(tPath);
                        }
                    }
                    return;

                case "Space":
                case "Enter":
                    if (selectedMod) {
                        ev.preventDefault();
                        if (isActive) selectedMod.disable();
                        else selectedMod.enable();
                    }
                    return;
            }
        }

        addEventListener("keydown", keyDown);
        return () => {
            removeEventListener("keydown", keyDown);
        }
    }, [selectedMod, lastSelectedL_Path, lastSelectedR_Path]);
}



function ModTooltip({ data, onClose }: {
    data?: { pacageId: PackageId, anchorEl: HTMLElement }
    onClose: (e: Event | React.SyntheticEvent<Element, Event>) => void
}) {
    const { modList, setSelectedMod } = React.useContext(LocalModListContext);
    const mod = React.useMemo(() => {
        if (!data) return;
        return modList.mods.find(m => m.samePackageId(data.pacageId));
    }, [modList.mods, data?.pacageId]);


    const ErrorReportComponent = React.useCallback(({
        label, error, errorType, children
    }: {
        label: string
        error: boolean
        errorType: "danger" | "warning"
        children: React.ReactNode | React.ReactNode[]
    }) => {
        return !error ? null : (
            <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography color={errorType} level="body-sm">{label}</Typography>
                </Stack>
                {children}
            </Stack>
        )
    }, []);

    const ErrorReportModItemComponent = React.useCallback(({ mod, actions }: {
        mod: Mod,
        actions?: { label: string, onClick: () => void }[]
    }) => (
        <ListItemButton
            key={mod.packageId}
            onClick={e => {
                if (e.target instanceof HTMLElement && e.target.classList.contains("MuiButton-root")) return
                setSelectedMod(mod);
            }}
        >
            <Typography level="body-xs">{mod.name} ({mod.packageId})</Typography>
            {actions?.length && (
                <Stack direction="row" flexWrap="wrap">
                    {actions.map((a, i) => <Button key={i} size="sm" onClick={a.onClick}>{a.label}</Button>)}
                </Stack>
            )}
        </ListItemButton>
    ), []);


    const errorType = mod?.getErrorType();

    const ErrorReport = React.useMemo(() => !mod || !errorType ? null : (
        <Stack spacing={2}>
            <ErrorReportComponent label={Localize("missingDependencies")} error={mod.hasMissingDependencies()} errorType="danger">
                <List size="sm">
                    {[...mod.getMissingDependencies()].map(mod => (
                        mod instanceof Mod
                            ? (
                                <ErrorReportModItemComponent
                                    key={mod.packageId}
                                    mod={mod}
                                    actions={[{ label: Localize("enable"), onClick: () => mod.enable() }]}
                                />
                            ) : (
                                <ListItemButton key={mod.packageId} onClick={() => openUrl(mod.steamWorkshopUrl)}>
                                    <Typography level="body-xs">{mod.displayName} ({mod.packageId})</Typography>
                                </ListItemButton>
                            )
                    ))}
                </List>
            </ErrorReportComponent>
            <ErrorReportComponent label={Localize("incompatibleWith")} error={mod.hasIncompatible()} errorType="danger">
                <List size="sm">
                    {[...mod.getIncompatible()].map(mod => <ErrorReportModItemComponent
                        key={mod.packageId}
                        mod={mod}
                        actions={[{ label: Localize("disable"), onClick: () => mod.disable() }]}
                    />)}
                </List>
            </ErrorReportComponent>
            <ErrorReportComponent label={Localize("loadAfter")} error={mod.hasLoadAfterErrors()} errorType="danger">
                <List size="sm">
                    {[...mod.getLoadAfterErrors()].map(mod => <ErrorReportModItemComponent key={mod.packageId} mod={mod} />)}
                </List>
            </ErrorReportComponent>
            <ErrorReportComponent label={Localize("loadBefore")} error={mod.hasLoadBeforeErrors()} errorType="danger">
                <List size="sm">
                    {[...mod.getLoadBeforeErrors()].map(mod => <ErrorReportModItemComponent key={mod.packageId} mod={mod} />)}
                </List>
            </ErrorReportComponent>
            <ErrorReportComponent label={Localize("wrongModVersion")} error={mod.isWrongVersion()} errorType="warning">
                <Typography color="warning" level="body-sm" variant="soft">{Localize("wrongModVersion_message")}</Typography>
            </ErrorReportComponent>
            <ErrorReportComponent label={Localize("missingModVersion")} error={mod.isMissingModVersion()} errorType="warning">
                <Typography color="warning" level="body-sm" variant="soft">{Localize("wrongModVersion_message")}</Typography>
            </ErrorReportComponent>
        </Stack>
    ), [mod, errorType]);


    React.useEffect(() => {
        if (data?.anchorEl && !document.body.contains(data.anchorEl)) {
            onClose(new Event("close"));
        }
    }, [data]);


    return (
        <Tooltip
            open={!!data}
            slotProps={{
                root: {
                    open: !!data,
                    anchorEl: data?.anchorEl
                }
            }}

            arrow
            describeChild
            placement="right"
            onClose={onClose}

            title={mod &&
                <Stack spacing={2} p={1}>
                    {ErrorReport}
                    <ModTagList tags={mod.tags} packageId={mod.packageId} />
                    <Divider />
                    <ButtonGroup>
                        <Button sx={{ pointerEvents: "none" }}>{Localize("open")}</Button>
                        <IconButton variant="solid" onClick={() => mod.openInSteam()}><Steam /></IconButton>
                        <IconButton variant="solid" onClick={() => mod.openDir()}><FolderIcon /></IconButton>
                    </ButtonGroup>
                </Stack>
            }
            variant="outlined"
            children={<span />}
        />
    )
}

