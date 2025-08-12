import { Box, Button, ButtonGroup, Chip, CircularProgress, ColorPaletteProp, Divider, IconButton, Input, List, ListItemButton, ListItemDecorator, Stack, Tooltip, Typography } from "@mui/joy";
import React, { JSX } from "react";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
//#region Icons
import RimWorldIcon from "@Components/Icons/RimWorld";
import { FaSteam, FaGithub, FaFolder, FaXmark } from "react-icons/fa6";
//#endregion
import ModTagList from "@Components/ModTagList";
import Localize from "@Common/Localize";
import { LocalModListStores } from "./Context/LocalModListContext";
import { TagsVisibilityContext } from "./Context/TagsVisibilityContext";
import { Mod, Mod_ALL, ModErrorType } from "@Classes/Mod";
import { ModType } from "enums";
import { openUrl } from "view/scripts/utils";
import { shallowEqual } from "@Common/utils";
import { ModListStore } from "@Context/ModListContext";
import { ModsConfigStore } from "@Stores";
import { StoreCompareType } from "@Stores/store";
import { Portal } from "@mui/material";
import { useInView } from "react-intersection-observer";
import LoadingErrors from "./LoadingErrors";
import { FaLink } from "react-icons/fa";

const modListItemClass = "mod-list-item";

export default function ModList() {
    const [searchText, setSearchText] = React.useState("");

    return (
        <Stack gap={1} width="40%">
            <Input
                placeholder={Localize("search")}
                value={searchText}
                onChange={e => setSearchText(e.currentTarget.value)}
                endDecorator={<IconButton onClick={() => setSearchText("")} sx={{ borderRadius: "50%" }}><FaXmark /></IconButton>}
            />
            <Lists searchText={searchText} />
            <LoadingErrors />
        </Stack >
    )
}



function Lists({ searchText }: { searchText: string }) {
    const actives = ModListStore.actives.use();
    const unactives = ModListStore.unactives.use();


    const errors = ModListStore.modErrorsType.use();
    const activeMods = ModsConfigStore.use(mc => mc.activeMods, StoreCompareType.PrimitiveArray);
    const isLoaded = ModListStore.isLoaded.use();
    const { tagsV } = React.useContext(TagsVisibilityContext);
    const unaListRef = React.useRef<FixedSizeList<ItemData_R>>(null);
    const aListRef = React.useRef<FixedSizeList<ItemData_R>>(null);


    useKeyControls({ unaListRef, aListRef });

    const [isOpenModTooltip, setModTooltip] = React.useState<Parameters<typeof ModTooltip>[0]["data"]>();



    const activeModsErrorType = React.useMemo(() => {
        let prevE: ModErrorType = ModErrorType.None;

        for (const pid of activeMods) {
            const e = errors[pid];
            if (e == ModErrorType.Error) return e;
            else if (e !== undefined && prevE < e) prevE = e;
        }
        return prevE;
    }, [errors, activeMods]);


    const Item = React.useCallback(React.memo(function ({ mod, errorType }: ItemData) {
        console.log("ITEM");
        mod.store.use();
        const isSelected = LocalModListStores.selectedMod.use(sm => sm?.dirPath == mod.dirPath);

        const ref = React.useRef<HTMLLIElement>(null);
        // React.useEffect(() => void (mod.elementRef = ref.current), [ref]);

        const icon: JSX.Element = React.useMemo(() => {
            switch (mod.type) {
                case ModType.Steam: return <FaSteam />;
                case ModType.Local: return <FaFolder />;
                case ModType.DLC: return <RimWorldIcon />;
                case ModType.Git: return <FaGithub />;
            }
        }, [mod.type]);
        const status = React.useMemo(() => {
            if (errorType == ModErrorType.Error) return "error";
            else if (errorType == ModErrorType.Warn) return "warn";
            else if (errorType == ModErrorType.None) return "none";
        }, [errorType]);


        //#region Events
        const onClick = () => LocalModListStores.selectedMod.set(mod);
        const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
            if (
                !(e.relatedTarget instanceof HTMLElement) ||
                (
                    e.relatedTarget.getAttribute("role") !== "tooltip" &&
                    e.relatedTarget.closest("[role=tooltip]") == null
                )
            ) setModTooltip(undefined)
        }
        const onContextMenu = () => setModTooltip({ mod, anchorEl: ref.current!, errorType });
        const onDoubleClick = () => mod.toggleState();
        const onDragOver = (e: React.DragEvent<HTMLElement>) => e.preventDefault();
        const onDragStart = (e: React.DragEvent<HTMLElement>) => e.dataTransfer.setData("packageId", mod.about.packageId);
        const onDrop = React.useCallback((e: React.DragEvent<HTMLElement>) => {
            const targetId = e.dataTransfer.getData("packageId") as PackageId || "";
            if (!targetId) return;

            const elem = e.currentTarget.closest(`.${modListItemClass}`);
            if (!elem) return $invoke.activeModAfter(targetId, mod.about.packageId);

            const rect = elem.getBoundingClientRect();

            if (e.pageY > rect.top + rect.height / 2)
                $invoke.activeModAfter(targetId, mod.about.packageId);
            else
                $invoke.activeModBefore(targetId, mod.about.packageId);
        }, [mod.about.packageId]);
        //#endregion

        const backgroundStyle = React.useMemo(() => {
            return mod.tags.length <= 0
                ? "none" as const
                : `linear-gradient(90deg, transparent 50%, ${mod.tags.map(t => t.color).join(", ")})` as const
        }, [mod.tags]);

        return (
            <li
                ref={ref}
                className={`list-item ${isSelected ? "selected" : ""} ${modListItemClass}`}
                data-mod-path={mod.dirPath}
                style={{ height: itemHeight }}
                data-status={status}
                draggable
                onClick={onClick}
                onMouseLeave={onMouseLeave}
                onDoubleClick={onDoubleClick}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                {backgroundStyle !== "none" && <div className="background" style={{ background: backgroundStyle }} />}
                <div className="icon">{icon}</div>
                <div className="label">{mod.about.name}</div>
            </li>
        )
    }, (prev, next) => prev.mod.dirPath === next.mod.dirPath && prev.errorType === next.errorType), []);
    const Item_R = React.useCallback(React.memo(function ({ data, index, style }: ListChildComponentProps<ItemData_R>) {
        const mod = data.list[index]!;
        const errorType = data.errors[mod.about.packageId]!;
        return (
            <Box style={style}>
                <Item mod={mod} errorType={errorType} />
            </Box>
        );
    }), []);

    function LoadingElement() {
        return (
            <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
                <CircularProgress />
            </Stack>
        )
    }




    const filter = React.useCallback((mods: Mod_ALL[]) =>
        mods.filter(mod =>
            mod.about.name.toLowerCase().includes(searchText.toLowerCase()) &&
            (!tagsV.size || mod.tags.some(t => tagsV.has(t.name)))
        ),
        [searchText, tagsV]
    );

    const filteredUnactivesMods = React.useMemo(() => filter(unactives), [unactives, filter]);
    const filteredActivesMods = React.useMemo(() => filter(actives), [actives, filter]);


    return (
        <Stack
            id="lists"
            direction="row"
            gap={1}
            flex={1}
            overflow="hidden"
            sx={{
                "& .MuiList-root": {
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: "100%",
                    width: "50%",
                }
            }}
        >
            <List variant="outlined" id="list-unactive">
                {!isLoaded ? <LoadingElement /> :
                    <AutoSizer>
                        {({ height, width }) => (
                            <FixedSizeList<ItemData_R>
                                height={height}
                                width={width}
                                itemCount={filteredUnactivesMods.length}
                                itemSize={itemHeight}
                                itemData={{
                                    list: filteredUnactivesMods,
                                    errors: errors,
                                }}
                                itemKey={(index, data) => data.list[index]!.dirPath}
                                ref={unaListRef}
                            >{Item_R}</FixedSizeList>
                        )}
                    </AutoSizer>
                }
            </List>
            <List variant="outlined" id="list-active" color={activeModsErrorType == ModErrorType.Error ? "danger" : activeModsErrorType == ModErrorType.Warn ? "warning" : undefined}>
                {!isLoaded ? <LoadingElement /> :
                    <AutoSizer>
                        {({ height, width }) => (
                            <FixedSizeList<ItemData_R>
                                height={height}
                                width={width}
                                itemCount={filteredActivesMods.length}
                                itemSize={itemHeight}
                                itemData={{
                                    list: filteredActivesMods,
                                    errors: errors,
                                }}
                                itemKey={(index, data) => data.list[index]!.dirPath}
                                ref={aListRef}
                            >{Item_R}</FixedSizeList>
                        )}
                    </AutoSizer>
                }
            </List>
            <ModTooltip
                data={isOpenModTooltip}
                onClose={e => setModTooltip(undefined)}
            />
        </Stack>
    )
}
const itemHeight = 36;
type ItemData_R = {
    list: Mod_ALL[],
    errors: Record<PackageId, ModErrorType>,
};
type ItemData = {
    mod: Mod_ALL,
    errorType: ModErrorType,
};










function ModTooltip({ data, onClose }: {
    data?: {
        mod: Mod_ALL,
        anchorEl: HTMLElement
        errorType: ModErrorType
    },
    onClose: (e: Event | React.SyntheticEvent<Element, Event>) => void
}) {
    return (
        <Tooltip
            open={!!data}
            onClose={onClose}
            arrow
            placement="right"
            sx={{
                left: "-2px !important"
            }}

            slotProps={{
                root: {
                    open: !!data,
                    anchorEl: data?.anchorEl,
                }
            }}

            title={data && <ModTooltip.Content {...data} />}
            variant="outlined"
            children={<span style={{ display: "none" }} />}
        />
    )
}

ModTooltip.Content = ({ mod, errorType }: {
    mod: Mod_ALL,
    errorType: ModErrorType
}) => {
    mod.store.use();

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
        mod: Mod_ALL,
        actions?: { label: string, onClick: () => void }[]
    }) => (
        <ListItemButton
            key={mod.about.packageId}
            onClick={e => {
                if (e.target instanceof HTMLElement && e.target.classList.contains("MuiButton-root")) return
                LocalModListStores.selectedMod.set(mod);
            }}
        >
            <Typography level="body-xs">{mod.about.name} ({mod.about.packageId})</Typography>
            {actions?.length && (
                <Stack direction="row" flexWrap="wrap">
                    {actions.map((a, i) => <Button key={i} size="sm" onClick={a.onClick}>{a.label}</Button>)}
                </Stack>
            )}
        </ListItemButton>
    ), []);

    const ErrorReport = React.useMemo(() => {
        if (errorType == ModErrorType.None) return null;

        return mod && (
            <Stack spacing={2}>
                <ErrorReportComponent label={Localize("missingDependencies")} error={mod.hasMissingDependencies()} errorType="danger">
                    <List size="sm">
                        {[...mod.getMissingDependencies()].map(mod => (
                            mod instanceof Mod
                                ? (
                                    <ErrorReportModItemComponent
                                        key={mod.about.packageId}
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
                            key={mod.about.packageId}
                            mod={mod}
                            actions={[{ label: Localize("disable"), onClick: () => mod.disable() }]}
                        />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("loadAfter")} error={mod.hasLoadAfterErrors()} errorType="danger">
                    <List size="sm">
                        {[...mod.getLoadAfterErrors()].map(mod => <ErrorReportModItemComponent key={mod.about.packageId} mod={mod} />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("loadBefore")} error={mod.hasLoadBeforeErrors()} errorType="danger">
                    <List size="sm">
                        {[...mod.getLoadBeforeErrors()].map(mod => <ErrorReportModItemComponent key={mod.about.packageId} mod={mod} />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("wrongModVersion")} error={mod.isWrongVersion()} errorType="warning">
                    <Typography color="warning" level="body-sm" variant="soft">{Localize("wrongModVersion_message")}</Typography>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("missingModVersion")} error={mod.isMissingModVersion()} errorType="warning">
                    <Typography color="warning" level="body-sm" variant="soft">{Localize("wrongModVersion_message")}</Typography>
                </ErrorReportComponent>
            </Stack>
        )
    }, [errorType, mod]);


    return (
        <Stack spacing={2} p={1}>
            {ErrorReport}
            <ModTagList tags={mod.tags} packageId={mod.about.packageId} />
            <Divider />
            <ButtonGroup>
                <Button sx={{ pointerEvents: "none" }}>{Localize("open")}</Button>
                <IconButton variant="solid" onClick={() => mod.openDir()}><FaFolder /></IconButton>
                {mod.hasSourceUrl() && <IconButton variant="solid" onClick={() => mod.openSource()}><FaLink /></IconButton>}
                {mod.isSteam() && <IconButton variant="solid" onClick={() => mod.openInSteam()}><FaSteam /></IconButton>}
                {mod.isGit() && <IconButton variant="solid" onClick={() => mod.openInGit()}><FaGithub /></IconButton>}
            </ButtonGroup>
        </Stack>
    )
}



function useKeyControls({ unaListRef, aListRef }: {
    aListRef: React.RefObject<FixedSizeList<ItemData_R> | null>,
    unaListRef: React.RefObject<FixedSizeList<ItemData_R> | null>,
}) {
    const lastUnaI = React.useRef(0);
    const lastAI = React.useRef(0);

    const selectedMod = LocalModListStores.selectedMod.use();

    function detData(dataOfValue: boolean) {
        return dataOfValue
            ? { index: lastAI, list: ModListStore.actives.get(), ref: aListRef }
            : { index: lastUnaI, list: ModListStore.unactives.get(), ref: unaListRef };
    }

    React.useEffect(() => {
        let canRun = true;
        function onKeyDown(ev: KeyboardEvent) {
            const target = ev.target as HTMLElement;

            // Ігноруємо, якщо фокус у input, textarea або contenteditable
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) return;

            if (!canRun) return;
            canRun = false;

            const currentDataValue = (LocalModListStores.selectedMod.get()?.isActive() ?? false)

            let targetData = detData(currentDataValue);

            const move_up = ["KeyW", "ArrowUp"] as const;
            const move_down = ["KeyS", "ArrowDown"] as const;
            const move_vertical = [...move_up, ...move_down];

            const move_left = ["KeyA", "ArrowLeft"] as const;
            const move_right = ["KeyD", "ArrowRight"] as const;
            const move_horizontal = [...move_left, ...move_right];

            if (typedInclude(["Enter"], ev.code)) {
                LocalModListStores.selectedMod.get()?.toggleState();
            } else if (typedInclude([...move_vertical, ...move_horizontal], ev.code)) {
                if (typedInclude(move_vertical, ev.code)) {
                    if (typedInclude(move_up, ev.code)) targetData.index.current--;
                    else if (typedInclude(move_down, ev.code)) targetData.index.current++;
                    else throw Error("Never");
                }

                if (typedInclude(move_horizontal, ev.code)) {
                    targetData = detData(!currentDataValue);
                }

                if (targetData.index.current >= targetData.list.length) targetData.index.current = 0;
                else if (targetData.index.current < 0) targetData.index.current = targetData.list.length - 1;


                const t = targetData.list[targetData.index.current];
                targetData.ref.current?.scrollToItem(targetData.index.current);
                LocalModListStores.selectedMod.set(t);
            }

            setTimeout(() => canRun = true, 50);
        }

        addEventListener("keydown", onKeyDown);
        return () => removeEventListener("keydown", onKeyDown);
    }, []);

    React.useEffect(() => {
        if (!selectedMod) return;
        let targetData = detData(selectedMod.isActive());

        targetData.index.current = targetData.list.indexOf(selectedMod);
    }, [selectedMod]);
}


function typedInclude<const T extends V, V>(array: readonly T[], value: V): value is T {
    return array.includes(value as any);
}