import React, { Suspense } from "react";
import { Badge, Box, Button, ButtonGroup, Divider, FormHelperText, IconButton, Input, Stack, Tooltip, Typography } from "@mui/joy";
//#region Icons
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
//#endregion
import ModPackListWindowModal from "@Windows/ModPackList/ModPackListWindowModal";
import Localize from "@Common/Localize";
import { getContrastColor } from "@Common/utils";
import { Mod } from "@Classes/Mod";
import { UserConfigStore } from "@Stores";
import { PromptService } from "@Services/Prompt";
import { ConfirmService } from "@Services/Confirm";
import { TagsVisibilityContext } from "./Context/TagsVisibilityContext";
import { ModListStore } from "@Context/ModListContext";
import { StoreCompares } from "@Stores/store";
import GitModsModal from "@Windows/GitMods/Modal";
import useGitModsNotify from "@Windows/GitMods/Notify";
import * as colorsGroups from "@mui/material/colors";


export default function Actions() {
    return (
        <Stack flex={0} sx={{ whiteSpace: "nowrap" }} gap={1}>
            <Divider><Typography>{Localize("section_Windows")}</Typography></Divider>
            <OpenPacks />
            <GitMods />

            <Divider><Typography>{Localize("section_ModList")}</Typography></Divider>
            <Sort />
            <ClearActiveMods />

            <Divider><Typography>{Localize("section_Stats")}</Typography></Divider>
            <Stats />

            <Divider><Typography>{Localize("section_Tags")}</Typography></Divider>
            <TagList />
        </Stack>
    )
}

//#region Windows
function OpenPacks() {
    const [isOpen, setOpen] = React.useState(false);

    const onLoad = () => setOpen(true);
    const onClose = () => setOpen(false);

    return (
        <>
            <Button size="sm" onClick={onLoad} startDecorator={<ListAltIcon />}>{Localize("modPacks")}</Button>
            <ModPackListWindowModal open={isOpen} onClose={onClose} />
        </>
    )
}
function GitMods() {
    const [isOpen, setOpen] = React.useState(false);
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);

    const notify = useGitModsNotify();


    return (
        <>
            <Badge badgeInset={8} badgeContent={notify.count} size="sm">
                <Button size="sm" onClick={onOpen} startDecorator={<ListAltIcon />} sx={{ flexGrow: 1 }}>{Localize("Git")}</Button>
            </Badge>
            <GitModsModal open={isOpen} onClose={onClose} gitModsDialogParams={notify.params} />
        </>
    )
}
//#endregion



//#region ModList
function Sort() {
    const activeMods = ModListStore.actives.use();

    const DirectedAcyclicGraph = React.useMemo(() => class DirectedAcyclicGraph {
        private adjacencyList: number[][];
        private numVertices: number;

        constructor(numVertices: number) {
            this.numVertices = numVertices;
            this.adjacencyList = Array.from({ length: numVertices }, () => []);
        }

        addEdge(from: number, to: number): void {
            this.adjacencyList[from]!.push(to);
        }

        topologicalSort(): number[] {
            const visited = new Array(this.numVertices).fill(false);
            const result: number[] = [];

            const dfs = (v: number) => {
                visited[v] = true;
                for (const neighbor of this.adjacencyList[v]!) {
                    if (!visited[neighbor]) dfs(neighbor);
                }
                result.push(v);
            };

            for (let i = 0; i < this.numVertices; i++) {
                if (!visited[i]) dfs(i);
            }
            return result.reverse();
        }

        findCycle(): number {
            const visited = new Array(this.numVertices).fill(false);
            const stack = new Array(this.numVertices).fill(false);

            const dfs = (v: number): boolean => {
                visited[v] = true;
                stack[v] = true;

                for (const neighbor of this.adjacencyList[v]!) {
                    if (!visited[neighbor] && dfs(neighbor)) {
                        return true;
                    } else if (stack[neighbor]) {
                        return true;
                    }
                }

                stack[v] = false;
                return false;
            };

            for (let i = 0; i < this.numVertices; i++) {
                if (!visited[i] && dfs(i)) {
                    return i;
                }
            }

            return -1;
        }
    }, []);

    const trySortMods = React.useCallback(function trySortMods(activeModsInLoadOrder: Mod[]) {
        const list = [...activeModsInLoadOrder];
        const dag = new DirectedAcyclicGraph(list.length);

        for (let i = 0; i < list.length; i++) {
            const mod = list[i]!;

            // Додати залежності "loadBefore" і "forceLoadBefore"
            for (const before of [...mod.about.loadBefore ?? [], ...mod.about.forceLoadBefore ?? []]) {
                const target = list.find(m => m.samePackageId(before, true));
                if (target) {
                    dag.addEdge(list.indexOf(target), i);
                }
            }

            // Додати залежності "loadAfter" і "forceLoadAfter"
            for (const after of [...mod.about.loadAfter ?? [], ...mod.about.forceLoadAfter ?? []]) {
                const target = list.find(m => m.samePackageId(after, true));
                if (target) {
                    dag.addEdge(i, list.indexOf(target));
                }
            }
        }

        const cycleIndex = dag.findCycle();
        if (cycleIndex !== -1) {
            throw Error(`ModCyclicDependency: ${list[cycleIndex]!.about.name}`);
        } else {
            const sortedIndices = dag.topologicalSort();
            const sortedMods = sortedIndices.map(i => list[i]!);
            return sortedMods.reverse();
        }
    }, [DirectedAcyclicGraph]);

    function onSort() {
        const result = trySortMods([...activeMods]).map(a => a.about.packageId);
        $invoke.setActiveMods(result);
    }
    return (
        <Button size="sm" onClick={onSort} startDecorator={<SwapVertIcon />}>{Localize("sort")}</Button>
    )
}
function ClearActiveMods() {
    return (
        <Button size="sm" color="danger" onClick={() => $invoke.clearModsConfig()} startDecorator={<ClearIcon />}>{Localize("clearActiveMods")}</Button>
    )
}
//#endregion









const Stats = React.memo(function Stats() {
    const activesLength = ModListStore.actives.use(l => l.length);
    const modsLength = ModListStore.mods.use(l => Object.keys(l).length);

    return (
        <Stack>
            <Typography>{Localize("activeMods", [activesLength, modsLength])}</Typography>
        </Stack>
    )
});


function TagList() {
    const userTags = UserConfigStore.use(uc => uc.tags, (p, n) =>
        StoreCompares.isEqualAtArray(p, n, (p, n) => p.name === n.name && p.color === n.color)
    );
    const { tagsV, setTagsV } = React.useContext(TagsVisibilityContext);

    async function onAdd() {
        const name = await PromptService.create({
            text: Localize("tagName"),
            onValidate: (value) => userTags.some(t => t.name == value) ? Localize("thisNameAlreadyUsed") : true,
        }).endPromise;

        if (name)
            $invoke.setTag({
                name, color: "#000000",
                packageIds: []
            });
    }
    async function onRemove(tagname: string) {
        if (!await ConfirmService.create({ text: Localize("confirmDeletionTag") })) return;
        $invoke.removeTag(tagname);
    }

    // const CustomTag = React.useCallback(function ({ tag, transparent }: { tag: ModTag, transparent: boolean }) {
    //     return (
    //         <ModTag
    //             sx={{
    //                 opacity: transparent ? .25 : 1,
    //                 flexGrow: 1,
    //             }}
    //             tag={tag}
    //             key={tag.name}
    //             onClick={() => {
    //                 setTagsV(tagsV => {
    //                     if (tagsV.has(tag.name)) tagsV.delete(tag.name);
    //                     else tagsV.add(tag.name);
    //                     return new Set(tagsV);
    //                 });
    //             }}
    //         >
    //             <IconButton
    //                 size="sm"
    //                 variant="outlined"
    //                 onClick={onRemove.bind({}, tag)}
    //             >
    //                 <CloseIcon />
    //             </IconButton>
    //         </ModTag>
    //     )
    // }, [tagsV, onAdd, onRemove]);

    const ModTagTooltip = React.useCallback(function ModTagTooltip({ tag }: { tag: ModTag_Visualdata }) {
        const [inputValue, setInputValue] = React.useState(tag.name);
        const isInputError = React.useMemo(() => {
            const userTags = UserConfigStore.get().tags;
            return userTags.some(t => t !== tag && t.name === inputValue);
        }, [inputValue]);

        function onSave() {
            if (isInputError) return;
            $invoke.updateTag(tag.name, "name", inputValue);
        }

        return (
            <Stack spacing={1}>
                <Input
                    placeholder={Localize("tagName")}
                    value={inputValue}
                    endDecorator={
                        <IconButton
                            color={isInputError ? "danger" : "neutral"}
                            onClick={onSave}
                            disabled={isInputError}
                        >
                            <SaveIcon />
                        </IconButton>
                    }
                    onChange={e => setInputValue(e.currentTarget.value)}
                    onKeyUp={(e) => { if (e.code == "Enter") onSave(); }}
                    error={isInputError}
                />
                {isInputError && <FormHelperText sx={t => ({ color: t.palette.danger.softColor })}>{Localize("thisNameAlreadyUsed")}</FormHelperText>}

                <Divider>Color</Divider>
                <Stack direction="row">
                    {Object.entries({ _base: { 0: "#000000", 100: "#ffffff" }, ...colorsGroups }).map(([name, colors]) =>
                        <Stack key={name}>{Object.entries(colors).map(([v, color]) => isNaN(+v) ? null :
                            <Box
                                key={v}
                                sx={{
                                    background: color,
                                    width: 20,
                                    height: 20,
                                    cursor: "pointer",
                                    justifyContent: "center",
                                    display: "flex",
                                    "&:hover": { boxShadow: "inset 0 0 0px 1px rgba(0, 0, 0, 1)" }
                                }}
                                onClick={() => {
                                    $invoke.updateTag(tag.name, "color", color);
                                }}
                            >
                                {color == tag.color ? <Typography sx={{ color: getContrastColor(color) }}>X</Typography> : null}
                            </Box>)}
                        </Stack>
                    )}
                </Stack>
            </Stack>
        )
    }, []);

    const TagComponent = React.useCallback(({ tag, disabled }: { tag: ModTag_Visualdata, disabled: boolean }) => {
        const [isTooltipOpen, setTooltipOpen] = React.useState(false);


        return (
            <ButtonGroup
                sx={t => ({
                    opacity: disabled ? .25 : void 0,
                    pointerEvents: disabled ? "none" : void 0,
                    flexGrow: 1,

                    "& > button.MuiIconButton-root": {
                        px: .5,
                        py: .25,
                        minHeight: 0,
                        background: tag.color,
                        "&:hover": {
                            background: t.palette.neutral[800],
                            "& *": { color: t.palette.common.white }
                        }
                    },
                    "& > button.MuiIconButton-root > .MuiSvgIcon-root": {
                        fontSize: 15,
                        color: getContrastColor(tag.color),
                        opacity: .8
                    },
                })}
            >
                <Tooltip
                    arrow
                    placement="bottom"
                    open={isTooltipOpen}
                    onClose={e => e.type != "blur" && setTooltipOpen(false)}
                    title={<ModTagTooltip tag={tag} />}
                    variant="outlined"
                >
                    <IconButton
                        size="sm"
                        variant="outlined"
                        onClick={() => {
                            setTagsV(tagsV => {
                                if (tagsV.has(tag.name)) tagsV.delete(tag.name);
                                else tagsV.add(tag.name);
                                return new Set(tagsV);
                            });
                        }}
                        onContextMenu={() => setTooltipOpen(true)}
                        sx={{ flex: 1 }}
                    >
                        <Typography
                            level="body-xs"
                            sx={{
                                color: getContrastColor(tag.color),
                                opacity: .8,
                                maxWidth: 100,
                            }}
                            title={tag.name}
                            noWrap
                        >{tag.name}</Typography>
                    </IconButton>
                </Tooltip>
                <IconButton
                    size="sm"
                    variant="outlined"
                    onClick={onRemove.bind({}, tag.name)}
                >
                    <CloseIcon />
                </IconButton>
            </ButtonGroup>
        );
    }, []);

    return (
        <Stack spacing={1} px={1} overflow="auto">
            <Stack
                spacing={1}
                useFlexGap
                direction="row"
                flexWrap="wrap"
                sx={{
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {userTags.map(tag => <TagComponent key={tag.name} tag={tag} disabled={!!tagsV.size && !tagsV.has(tag.name)} />)}
            </Stack>
            <IconButton variant="outlined" onClick={onAdd} size="sm"><AddIcon /></IconButton>
        </Stack>
    )
}