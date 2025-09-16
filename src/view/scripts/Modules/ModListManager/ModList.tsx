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
import { ModActions } from "@Renderer/scripts/Components/ModActions";

const modListItemClass = "mod-list-item";
const listsId = "lists";

export default function ModList() {
    return (
        <Stack gap={1}>
            <Search />
            <Actions />

            <Stack
                id={listsId}
                direction="row"
                gap={1}
                flex={1}
                overflow="hidden"
            >
                <LF_List />
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


function Search() {
    const searchTextD = __ModListStores__.searchTextD.use();
    const searchTextE = __ModListStores__.searchTextE.use();
    const splitSearchInput = __ModListStores__.splitSearchInput.use();

    if (!splitSearchInput) {
        return (
            <Input
                placeholder={Localize("actions.search")}
                value={searchTextD}
                onChange={e => {
                    __ModListStores__.searchTextD.set(e.currentTarget.value);
                    __ModListStores__.searchTextE.set(e.currentTarget.value);
                }}
                endDecorator={
                    <IconButton
                        onClick={() => {
                            __ModListStores__.searchTextD.set("");
                            __ModListStores__.searchTextE.set("");
                        }}
                        sx={{ borderRadius: "50%" }}
                    ><CloseIcon /></IconButton>
                }
            />
        );
    } else {
        return (
            <Stack direction="row" spacing={1}>
                <Input
                    placeholder={Localize("actions.search")}
                    value={searchTextD}
                    onChange={e => __ModListStores__.searchTextD.set(e.currentTarget.value)}
                    endDecorator={
                        <IconButton
                            onClick={() => __ModListStores__.searchTextD.set("")}
                            sx={{ borderRadius: "50%" }}
                        ><CloseIcon /></IconButton>
                    }
                    fullWidth
                />
                <Input
                    placeholder={Localize("actions.search")}
                    value={searchTextE}
                    onChange={e => __ModListStores__.searchTextE.set(e.currentTarget.value)}
                    endDecorator={
                        <IconButton
                            onClick={() => __ModListStores__.searchTextE.set("")}
                            sx={{ borderRadius: "50%" }}
                        ><CloseIcon /></IconButton>
                    }
                    fullWidth
                />
            </Stack>
        )
    }
}
function Actions() {
    const SplitSearch = React.useCallback(function SplitSearch() {
        const e = __ModListStores__.splitSearchInput.use();
        return (
            <IconButton
                variant={e ? "solid" : "soft"}
                onClick={() => __ModListStores__.splitSearchInput.set(e => !e)}
                title="Split search"
            >S</IconButton>
        )
    }, []);
    const ShowModIcon = React.useCallback(function ShowModIcon() {
        const e = __ModListStores__.showModIcon.use();
        return (
            <IconButton
                variant={e ? "solid" : "soft"}
                onClick={() => __ModListStores__.showModIcon.set(e => !e)}
                title="Show mod icon"
            >I</IconButton>
        )
    }, []);
    return (
        <ButtonGroup variant="outlined">
            <SplitSearch />
            <ShowModIcon />
        </ButtonGroup>
    )
}



function LF_List() {
    const filterByTags = __ModListStores__.filterByTags.use();


    const LListRef = React.useRef<VirtuosoHandle>(null);
    const RListRef = React.useRef<VirtuosoHandle>(null);


    useKeyControls({ LListRef, RListRef });


    const errors = __ModListStores__.modErrorsType.use();


    const Item = React.useCallback(React.memo(function Item({ mod, errorType }: {
        mod: Mod_ALL,
        errorType: ModErrorType,
    }) {
        // console.log("ITEM");
        const isSelected = __ModListStores__.selectedMods.use(m => m.includes(mod));

        const ref = React.useRef<HTMLLIElement>(null);
        const status = React.useMemo(() => {
            if (errorType == ModErrorType.Error) return "error";
            else if (errorType == ModErrorType.Warn) return "warn";
            else if (errorType == ModErrorType.None) return "none";
            return "none";
        }, [errorType]);


        //#region Events
        const onClick = React.useCallback((e: React.MouseEvent<HTMLElement>) => {
            if (e.ctrlKey) {
                __ModListStores__.selectedMods.set(mods => {
                    if (mods.includes(mod)) return mods.filter(m => m !== mod);
                    else return [...mods, mod];
                });
            } else if (e.shiftKey) {
                const list = mod.isActive() ? __ModListStores__.enabled.get() : __ModListStores__.disabled.get();
                const firstMod = __ModListStores__.selectedMods.get()[0];
                if (firstMod) __ModListStores__.selectedMods.set(Select.FromTo(list, firstMod, mod));
            } else {
                __ModListStores__.selectedMods.set([mod]);
            }
        }, [mod]);
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
        const onDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
            if (!e.ctrlKey && !e.shiftKey) mod.toggleState()
        };
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


        const BG = React.useCallback(React.memo(function BG() {
            const modTags = mod.store.use(mod => mod.tags, Tag.storeComparePattern("color"));
            if (modTags.length <= 0) return null;
            return <div className="background" style={{ background: `linear-gradient(90deg, transparent 50%, ${modTags.map(t => t.color).join(", ")})` }} />;
        }), [mod]);

        const Icon = React.useCallback(React.memo(function Icon() {
            const showModIcon = __ModListStores__.showModIcon.use();
            return <div
                className="icon"
                style={{ width: 18, height: 18 }}
            >{showModIcon ? mod.getSelfIcon({}) : mod.getTypeIcon()}</div>;
        }), [mod]);


        return (
            <li
                ref={ref}
                className={`list-item ${isSelected ? "selected" : ""} ${modListItemClass}`}
                // style={{ height: itemHeight }}
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
                <Icon />
                <div className="label">{mod.about.name}</div>
            </li>
        )
    }), []);

    function LoadingElement() {
        return (
            <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
                <CircularProgress />
            </Stack>
        )
    }


    const checkByTags = React.useCallback(function checkByTags(mod: Mod) {
        return !filterByTags.size || mod.tags.some(t => filterByTags.has(t))
    }, [filterByTags]);


    // const filter = React.useCallback(function filter(mods: Mod_ALL[]) {
    //     return mods.filter(mod =>
    //         mod.about.name.toLowerCase().includes(searchTextD.toLowerCase()) &&
    //         checkByTags(mod)
    //     )
    // }, [searchTextD, filterByTags]);


    const DisabledList = React.useCallback(function LeftList({ modErrors }: { modErrors: typeof errors }) {
        const RenderList = React.useCallback(React.memo(function RenderList() {
            const isLoaded = __GlobalStores__.isLoaded.use();
            const disabledList = __ModListStores__.disabled.use();
            const searchTextD = __ModListStores__.searchTextD.use();

            const filteredUnactivesMods = React.useMemo(() =>
                disabledList.filter(mod =>
                    mod.about.name.toLowerCase().includes(searchTextD.toLowerCase()) &&
                    checkByTags(mod)
                ),
                [searchTextD, disabledList, checkByTags]
            );


            if (!isLoaded) return <LoadingElement />;
            return (
                <Virtuoso
                    ref={LListRef}
                    data={filteredUnactivesMods}
                    totalCount={filteredUnactivesMods.length}
                    style={{ flex: 1 }}
                    // fixedItemHeight={itemHeight}
                    itemContent={(index, item) => (
                        <Item
                            mod={item}
                            errorType={modErrors[item.about.packageId]!}
                        />
                    )}
                />
            )
        }), []);

        return (
            <List
                size="sm"
                variant="outlined"
                sx={{ flex: 1, overflow: "hidden" }}
            >
                <RenderList />
            </List>
        )
    }, [checkByTags]);
    const EnabledList = React.useCallback(function RightList({ modErrors }: { modErrors: typeof errors }) {
        const isLoaded = __GlobalStores__.isLoaded.use();
        const enabledList = __ModListStores__.enabled.use();
        const searchTextE = __ModListStores__.searchTextE.use();
        const filteredActivesMods = React.useMemo(() =>
            enabledList.filter(mod =>
                mod.about.name.toLowerCase().includes(searchTextE.toLowerCase()) &&
                checkByTags(mod)
            ),
            [searchTextE, enabledList, checkByTags]
        );
        const activeModsErrorType = React.useMemo(() => {
            let prevE: ModErrorType = ModErrorType.None;

            for (const m of enabledList) {
                const e = modErrors[m.about.packageId];
                if (e == ModErrorType.Error) return e;
                else if (e !== undefined && prevE < e) prevE = e;
            }
            return prevE;
        }, [modErrors, enabledList]);

        return (
            <List
                size="sm"
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
                        // fixedItemHeight={itemHeight}
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
    }, [checkByTags]);



    return (
        <>
            <DisabledList modErrors={errors} />
            <EnabledList modErrors={errors} />
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
                __ModListStores__.selectedMods.set([mod]);
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
        <Stack spacing={2} p={1} divider={<Divider />} maxWidth={500}>
            {ErrorReport}
            <ModTagList mod={mod} />
            <ModActions mod={mod} />
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
    const lastDIndex = React.useRef(0);
    const lastEIndex = React.useRef(0);

    function getData(dataOfValue: boolean) {
        return dataOfValue
            ? { index: lastEIndex, list: __ModListStores__.enabled.get(), ref: RListRef }
            : { index: lastDIndex, list: __ModListStores__.disabled.get(), ref: LListRef };
    }

    React.useEffect(() => {
        const keys_move_up = ["KeyW", "ArrowUp"] as const;
        const keys_move_down = ["KeyS", "ArrowDown"] as const;
        const keys_move_vertical = [...keys_move_up, ...keys_move_down];

        const keys_move_left = ["KeyA", "ArrowLeft"] as const;
        const keys_move_right = ["KeyD", "ArrowRight"] as const;
        const keys_move_horizontal = [...keys_move_left, ...keys_move_right];

        const keys_action_blur = ["Escape"] as const;
        const keys_action_toggle = ["Enter", "Space"] as const;

        const keys_move_all = [...keys_move_horizontal, ...keys_move_vertical];
        const keys_actions_all = [...keys_action_toggle, ...keys_action_blur];
        const keys_all = [...keys_move_all, ...keys_actions_all];

        function onKeyDown(ev: KeyboardEvent) {
            const target = ev.target as HTMLElement;

            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) return;

            const currentDataValue = (__ModListStores__.selectedMods.get().some(m => m.isActive()));

            const currentData = getData(currentDataValue) as Readonly<ReturnType<typeof getData>>;
            let targetData = { ...currentData };


            if (typedInclude(keys_action_blur, ev.code)) {
                __ModListStores__.selectedMods.set([]);
            } else if (typedInclude(keys_action_toggle, ev.code)) {
                __ModListStores__.selectedMods.get().forEach(m => m.toggleState());
            } else if (typedInclude(keys_move_all, ev.code)) {
                if (typedInclude(keys_move_vertical, ev.code)) {
                    if (typedInclude(keys_move_up, ev.code)) targetData.index.current--;
                    else if (typedInclude(keys_move_down, ev.code)) targetData.index.current++;
                    else throw Error("Never");
                }

                if (typedInclude(keys_move_horizontal, ev.code) && !ev.shiftKey) {
                    targetData = getData(!currentDataValue);
                }

                if (targetData.index.current >= targetData.list.length) targetData.index.current = 0;
                else if (targetData.index.current < 0) targetData.index.current = targetData.list.length - 1;

                targetData.ref.current?.scrollToIndex({ index: targetData.index.current, align: "center" });

                if (ev.shiftKey) {
                    const firstMod = __ModListStores__.selectedMods.get()[0];
                    const range: [number, number] = [
                        firstMod ? currentData.list.indexOf(firstMod) : currentData.index.current,
                        targetData.index.current
                    ];
                    const needReverse = range[0] > range[1];
                    if (needReverse) range.reverse();

                    const resultRange = currentData.list.slice(range[0], range[1] + 1);
                    if (needReverse) resultRange.reverse();

                    __ModListStores__.selectedMods.set(
                        Select.FromTo(
                            currentData.list,
                            firstMod ? currentData.list.indexOf(firstMod) : currentData.index.current,
                            targetData.index.current
                        )
                    );
                } else {
                    const t = targetData.list[targetData.index.current];
                    if (t) __ModListStores__.selectedMods.set([t]);
                }
            }

            if (typedInclude(keys_all, ev.code)) ev.preventDefault();

        }

        addEventListener("keydown", onKeyDown);
        return () => removeEventListener("keydown", onKeyDown);
    }, []);

    React.useEffect(() => {
        function watcher() {
            const selectedMod = __ModListStores__.selectedMods.get().at(-1);
            if (!selectedMod) return;
            let targetData = getData(selectedMod.isActive());

            targetData.index.current = targetData.list.indexOf(selectedMod);
        }

        __ModListStores__.selectedMods.subscribe(watcher);
        return () => __ModListStores__.selectedMods.unsubscribe(watcher);
    }, []);
}


namespace Select {
    export function FromTo(list: Mod[], from: number, to: number): Mod_ALL[];
    export function FromTo(list: Mod[], from: Mod, to: Mod): Mod_ALL[];
    export function FromTo(list: Mod[], from: Mod | number, to: Mod | number) {
        if (typeof from == "number" && typeof to == "number") {
            const range: [number, number] = [from, to];
            const needReverse = range[0] > range[1];
            if (needReverse) range.reverse();

            const resultRange = list.slice(range[0], range[1] + 1);
            if (needReverse) resultRange.reverse();

            return resultRange;
        } else if (from instanceof Mod && to instanceof Mod) {
            const fromI = list.indexOf(from);
            const toI = list.indexOf(to);
            // if (fromI == -1 || toI == -1) return null;

            return FromTo(list, fromI, toI);
        } else throw Error("400");
    }
}