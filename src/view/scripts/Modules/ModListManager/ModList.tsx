import { Box, Button, ButtonGroup, CircularProgress, Divider, IconButton, Input, List, ListItemButton, Stack, Tooltip, Typography } from "@mui/joy";
import React, { JSX } from "react";
// import { FixedSizeList, ListChildComponentProps } from "react-window";
// import AutoSizer from "react-virtualized-auto-sizer";
//#region Icons
import RimWorldIcon from "@Renderer/scripts/Components/Icons/RimWorldIcon";
import SteamIcon from "@Renderer/scripts/Components/Icons/SteamIcon";
import GithubIcon from "@Renderer/scripts/Components/Icons/GithubIcon";
import FolderIcon from "@mui/icons-material/Folder";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
//#endregion
import ModTagList from "@Components/ModTagList";
import Localize from "@Common/Localize";
import { __ModListStores__ } from "./__ModListStore__";
import { Mod, Mod_ALL, ModErrorType } from "@Classes/Mod";
import { ModType } from "enums";
import { openUrl } from "view/scripts/utils";
import { typedInclude } from "@Common/utils";
import { Store } from "@Stores/store";
import LoadingErrors from "./LoadingErrors";
import UnknownPackageIdsErrors from "./UnknownPackageIdsErrors";
import Tag from "@Renderer/scripts/Classes/Tag";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

const modListItemClass = "mod-list-item";
const listsId = "lists";

export default function ModList() {
    const [searchText, setSearchText] = React.useState("");

    return (
        <Stack gap={1}>
            <Input
                placeholder={Localize("actions.search")}
                value={searchText}
                onChange={e => setSearchText(e.currentTarget.value)}
                endDecorator={<IconButton onClick={() => setSearchText("")} sx={{ borderRadius: "50%" }}><CloseIcon /></IconButton>}
            />

            <Stack
                id={listsId}
                direction="row"
                gap={1}
                flex={1}
                overflow="hidden"
            >
                <LF_List searchText={searchText} />
            </Stack>
            <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ "&>*": { flexGrow: 1 } }}
            >
                <LoadingErrors />
                <UnknownPackageIdsErrors />
            </Stack>
            <ModTooltip />
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





function LF_List({ searchText }: { searchText: string }) {
    const filterByTags = __ModListStores__.filterByTags.use();


    const LListRef = React.useRef<VirtuosoHandle>(null);
    const RListRef = React.useRef<VirtuosoHandle>(null);


    useKeyControls({ LListRef, RListRef });


    const errors = __ModListStores__.modErrorsType.use();


    const Item = React.useCallback(React.memo(function Item({ mod, errorType }: ItemData) {
        // console.log("ITEM");
        const isSelected = __ModListStores__.selectedMod.use(sm => sm?.dirPath == mod.dirPath);

        const ref = React.useRef<HTMLLIElement>(null);
        const status = React.useMemo(() => {
            if (errorType == ModErrorType.Error) return "error";
            else if (errorType == ModErrorType.Warn) return "warn";
            else if (errorType == ModErrorType.None) return "none";
        }, [errorType]);


        //#region Events
        const onClick = () => __ModListStores__.selectedMod.set(mod);
        const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
            if (
                !(e.relatedTarget instanceof HTMLElement) ||
                (
                    e.relatedTarget.getAttribute("role") !== "tooltip" &&
                    e.relatedTarget.closest("[role=tooltip]") == null
                )
            ) ModTooltip.Store.set(undefined)
        }
        const onContextMenu = () => ModTooltip.Store.set({ mod, anchorEl: ref.current!, errorType });
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


        const BG = React.useCallback(function BG() {
            const modTags = mod.store.use(mod => mod.tags, Tag.storeComparePattern("color"));
            if (modTags.length <= 0) return null;
            return <div className="background" style={{ background: `linear-gradient(90deg, transparent 50%, ${modTags.map(t => t.color).join(", ")})` }} />;
        }, [mod]);


        return (
            <li
                ref={ref}
                className={`list-item ${isSelected ? "selected" : ""} ${modListItemClass}`}
                style={{ height: itemHeight }}
                data-mod-path={mod.dirPath}
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
                <BG />
                <div className="icon">{mod.getIcon()}</div>
                <div className="label">{mod.about.name}</div>
            </li>
        )
    }), []);
    // const Item_R = React.useCallback(React.memo(function Item_R({ data, index, style }: ListChildComponentProps<ItemData_R>) {
    //     const mod = data.list[index]!;
    //     const errorType = data.errors[mod.about.packageId]!;
    //     return (
    //         <Box style={style}>
    //             <Item mod={mod} errorType={errorType} />
    //         </Box>
    //     );
    // }, (prev, next) => {
    //     const prevMod = prev.data.list[prev.index]!;
    //     const nextMod = next.data.list[next.index]!;

    //     const prevErrorType = prev.data.errors[prevMod.about.packageId]!;
    //     const nextErrorType = next.data.errors[nextMod.about.packageId]!;

    //     return prevMod.dirPath === nextMod.dirPath && prevErrorType === nextErrorType && prev.index === next.index;
    // }), []);

    function LoadingElement() {
        return (
            <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
                <CircularProgress />
            </Stack>
        )
    }



    const filter = React.useCallback(function filter(mods: Mod_ALL[]) {
        return mods.filter(mod =>
            mod.about.name.toLowerCase().includes(searchText.toLowerCase()) &&
            (!filterByTags.size || mod.tags.some(t => filterByTags.has(t))))
    }, [searchText, filterByTags]);


    const LeftList = React.useCallback(function LeftList({ modErrors }: { modErrors: typeof errors }) {
        const isLoaded = __GlobalStores__.isLoaded.use();
        const unactives = __ModListStores__.unactives.use();
        const filteredUnactivesMods = React.useMemo(() => filter(unactives), [unactives, filter]);
        return (
            <List
                variant="outlined"
                sx={{ flex: 1, overflow: "hidden" }}
            >
                {!isLoaded ? <LoadingElement />
                    : <Virtuoso
                        ref={LListRef}
                        data={filteredUnactivesMods}
                        totalCount={filteredUnactivesMods.length}
                        style={{ flex: 1 }}
                        fixedItemHeight={itemHeight}
                        itemContent={(index, item) => (
                            <Item
                                mod={item}
                                errorType={modErrors[item.about.packageId]!}
                            />
                        )}
                    />
                }
            </List>
        )
    }, [filter]);
    const RightList = React.useCallback(function RightList({ modErrors }: { modErrors: typeof errors }) {
        const isLoaded = __GlobalStores__.isLoaded.use();
        const actives = __ModListStores__.actives.use();
        const filteredActivesMods = React.useMemo(() => filter(actives), [actives, filter]);
        const activeModsErrorType = React.useMemo(() => {
            let prevE: ModErrorType = ModErrorType.None;

            for (const m of actives) {
                const e = modErrors[m.about.packageId];
                if (e == ModErrorType.Error) return e;
                else if (e !== undefined && prevE < e) prevE = e;
            }
            return prevE;
        }, [modErrors, actives]);

        return (
            <List
                variant="outlined"
                sx={{ flex: 1, overflow: "hidden" }}
                color={activeModsErrorType == ModErrorType.Error ? "danger" : activeModsErrorType == ModErrorType.Warn ? "warning" : undefined}
            >
                {!isLoaded ? <LoadingElement />
                    : <Virtuoso
                        ref={RListRef}
                        data={filteredActivesMods}
                        totalCount={filteredActivesMods.length}
                        style={{ flex: 1 }}
                        fixedItemHeight={itemHeight}
                        itemContent={(index, item) => (
                            <Item
                                mod={item}
                                errorType={modErrors[item.about.packageId]!}
                            />
                        )}
                    />
                }
            </List>
        )
    }, [filter]);



    return (
        <>
            <LeftList modErrors={errors} />
            <RightList modErrors={errors} />
        </>
    )
}





function ModTooltip() {
    const data = ModTooltip.Store.use();


    return (
        <Tooltip
            open={!!data}
            onClose={e => {
                if (e.type === "mouseleave")
                    ModTooltip.Store.set(undefined)
            }}
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

ModTooltip.Content = function Content({ mod, errorType }: {
    mod: Mod_ALL,
    errorType: ModErrorType
}) {
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
                __ModListStores__.selectedMod.set(mod);
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
                <ErrorReportComponent label={Localize("mods.missingDependencies")} error={mod.hasMissingDependencies()} errorType="danger">
                    <List size="sm">
                        {[...mod.getMissingDependencies()].map(mod => (
                            mod instanceof Mod
                                ? (
                                    <ErrorReportModItemComponent
                                        key={mod.about.packageId}
                                        mod={mod}
                                        actions={[{ label: Localize("actions.enable"), onClick: () => mod.enable() }]}
                                    />
                                ) : (
                                    <ListItemButton key={mod.packageId} onClick={() => openUrl(mod.steamWorkshopUrl)}>
                                        <Typography level="body-xs">{mod.displayName} ({mod.packageId})</Typography>
                                    </ListItemButton>
                                )
                        ))}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("mods.incompatibleWith")} error={mod.hasIncompatible()} errorType="danger">
                    <List size="sm">
                        {[...mod.getIncompatible()].map(mod => <ErrorReportModItemComponent
                            key={mod.about.packageId}
                            mod={mod}
                            actions={[{ label: Localize("actions.disable"), onClick: () => mod.disable() }]}
                        />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("mods.loadAfter")} error={mod.hasLoadAfterErrors()} errorType="danger">
                    <List size="sm">
                        {[...mod.getLoadAfterErrors()].map(mod => <ErrorReportModItemComponent key={mod.about.packageId} mod={mod} />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("mods.loadBefore")} error={mod.hasLoadBeforeErrors()} errorType="danger">
                    <List size="sm">
                        {[...mod.getLoadBeforeErrors()].map(mod => <ErrorReportModItemComponent key={mod.about.packageId} mod={mod} />)}
                    </List>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("mods.wrongModVersion")} error={mod.isWrongVersion()} errorType="warning">
                    <Typography color="warning" level="body-sm" variant="soft">{Localize("mods.wrongModVersion_message")}</Typography>
                </ErrorReportComponent>
                <ErrorReportComponent label={Localize("mods.missingModVersion")} error={mod.isMissingModVersion()} errorType="warning">
                    <Typography color="warning" level="body-sm" variant="soft">{Localize("mods.wrongModVersion_message")}</Typography>
                </ErrorReportComponent>
            </Stack>
        )
    }, [errorType, mod]);

    return (
        <Stack spacing={2} p={1} divider={<Divider />}>
            {ErrorReport}
            <ModTagList mod={mod} />
            <ButtonGroup>
                <Button sx={{ pointerEvents: "none" }}>{Localize("actions.open")}</Button>
                <IconButton variant="solid" onClick={() => mod.openDir()}><FolderIcon /></IconButton>
                {mod.hasSourceUrl() && <IconButton variant="solid" onClick={() => mod.openSource()}><LinkIcon /></IconButton>}
                {mod.isSteam() && <IconButton variant="solid" onClick={() => mod.openInSteam()}><SteamIcon /></IconButton>}
                {mod.isGit() && <IconButton variant="solid" onClick={() => mod.openInGit()}><GithubIcon /></IconButton>}
            </ButtonGroup>
        </Stack>
    )
}
ModTooltip.Store = new Store<undefined | {
    mod: Mod_ALL,
    anchorEl: HTMLElement
    errorType: ModErrorType
}>({ value: undefined });



function useKeyControls({ LListRef, RListRef }: {
    LListRef: React.RefObject<VirtuosoHandle | null>,
    RListRef: React.RefObject<VirtuosoHandle | null>,
}) {
    const lastUnaI = React.useRef(0);
    const lastAI = React.useRef(0);

    // const selectedMod = __ContextStores__.selectedMod.use();

    function getData(dataOfValue: boolean) {
        return dataOfValue
            ? { index: lastAI, list: __ModListStores__.actives.get(), ref: RListRef }
            : { index: lastUnaI, list: __ModListStores__.unactives.get(), ref: LListRef };
    }

    React.useEffect(() => {
        const move_up = ["KeyW", "ArrowUp"] as const;
        const move_down = ["KeyS", "ArrowDown"] as const;
        const move_vertical = [...move_up, ...move_down];

        const move_left = ["KeyA", "ArrowLeft"] as const;
        const move_right = ["KeyD", "ArrowRight"] as const;
        const move_horizontal = [...move_left, ...move_right];

        const move_all = [...move_horizontal, ...move_vertical]
        const move_arrowNav = move_all.filter(k => k.startsWith("Arrow")) as Extract<typeof move_all[number], `Arrow${string}`>[]

        function onKeyDown(ev: KeyboardEvent) {
            const target = ev.target as HTMLElement;

            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) return;

            const currentDataValue = (__ModListStores__.selectedMod.get()?.isActive() ?? false)

            let targetData = getData(currentDataValue);

            if (typedInclude(["Escape"], ev.code)) {
                __ModListStores__.selectedMod.set(undefined);
            } else if (typedInclude(["Enter"], ev.code)) {
                __ModListStores__.selectedMod.get()?.toggleState();
            } else if (typedInclude(move_all, ev.code)) {
                if (typedInclude(move_vertical, ev.code)) {
                    if (typedInclude(move_up, ev.code)) targetData.index.current--;
                    else if (typedInclude(move_down, ev.code)) targetData.index.current++;
                    else throw Error("Never");
                }

                if (typedInclude(move_horizontal, ev.code)) {
                    targetData = getData(!currentDataValue);
                }

                if (targetData.index.current >= targetData.list.length) targetData.index.current = 0;
                else if (targetData.index.current < 0) targetData.index.current = targetData.list.length - 1;


                const t = targetData.list[targetData.index.current];
                targetData.ref.current?.scrollToIndex({
                    index: targetData.index.current,
                    align: "center",
                });
                __ModListStores__.selectedMod.set(t);
            }

            if (typedInclude(move_arrowNav, ev.code)) ev.preventDefault();

        }

        addEventListener("keydown", onKeyDown);
        return () => removeEventListener("keydown", onKeyDown);
    }, []);

    React.useEffect(() => {
        function watcher() {
            const selectedMod = __ModListStores__.selectedMod.get();
            if (!selectedMod) return;
            let targetData = getData(selectedMod.isActive());

            targetData.index.current = targetData.list.indexOf(selectedMod);
        }

        __ModListStores__.selectedMod.subscribe(watcher);
        return () => __ModListStores__.selectedMod.unsubscribe(watcher);
    }, []);
}