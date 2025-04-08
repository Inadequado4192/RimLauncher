import React from "react";
import { Button, Chip, Divider, IconButton, Stack, Typography } from "@mui/joy";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ClearIcon from "@mui/icons-material/Clear";
import ModPackListWindowModal from "@Windows/ModPackListWindowModal";
import MyltiplayerCompabilityModal from "@Windows/MyltiplayerCompabilityModal";
import Localize from "@Common/Localize";
import { LocalModListContext } from "./Context/LocalModListContext";
import { Mod } from "../../Classes/Mod";
import { UserConfigContext } from "@Context/UserConfigContext";
import ModTag from "@Components/ModTag";
import { PromptService } from "@Services/Prompt";
import { TagsVisibilityContext } from "./Context/TagsVisibilityContext";
import CloseIcon from "@mui/icons-material/Close";
import { ConfirmService } from "@Services/Confirm";

export default function ModListActions() {
    return (
        <Stack flex={0} sx={{ whiteSpace: "nowrap" }} gap={1}>
            <Divider><Typography>{Localize("section_Windows")}</Typography></Divider>
            <OpenPacks />
            <MultiplayerCompability />

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
function ClearActiveMods() {
    return (
        <Button size="sm" color="danger" onClick={() => invoke.clearModsConfig()} startDecorator={<ClearIcon />}>{Localize("clearActiveMods")}</Button>
    )
}

function Sort() {
    const context = React.useContext(LocalModListContext);


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
            for (const before of [...mod.loadBefore, ...mod.forceLoadBefore]) {
                const target = list.find(m => m.samePackageId(before, true));
                if (target) {
                    dag.addEdge(list.indexOf(target), i);
                }
            }

            // Додати залежності "loadAfter" і "forceLoadAfter"
            for (const after of [...mod.loadAfter, ...mod.forceLoadAfter]) {
                const target = list.find(m => m.samePackageId(after, true));
                if (target) {
                    dag.addEdge(i, list.indexOf(target));
                }
            }
        }

        const cycleIndex = dag.findCycle();
        if (cycleIndex !== -1) {
            throw Error(`ModCyclicDependency: ${list[cycleIndex]!.name}`);
        } else {
            const sortedIndices = dag.topologicalSort();
            const sortedMods = sortedIndices.map(i => list[i]!);
            return sortedMods.reverse();
        }
    }, [DirectedAcyclicGraph]);

    function onSort() {
        const result = trySortMods([...context.modList.actives]).map(a => a?.packageId as PackageId);
        invoke.setActiveMods(result);
    }
    return (
        <Button size="sm" onClick={onSort} startDecorator={<SwapVertIcon />}>{Localize("sort")}</Button>
    )
}
function MultiplayerCompability() {
    const [isOpen, setOpen] = React.useState(false);

    const onLoad = () => setOpen(true);
    const onClose = () => setOpen(false);


    return (
        <>
            <Button size="sm" onClick={onLoad} startDecorator={<ListAltIcon />}>{Localize("multiplayerCompability")}</Button>
            <MyltiplayerCompabilityModal open={isOpen} onClose={onClose} />
        </>
    )
}


function Stats() {
    const { modList } = React.useContext(LocalModListContext);
    return (
        <Stack>
            <Typography>{Localize("activeMods")}: {modList.actives.length} / {modList.mods.length}</Typography>
        </Stack>
    )
}



function TagList() {
    const { userConfig: config } = React.useContext(UserConfigContext);
    const { tagsV, setTagsV } = React.useContext(TagsVisibilityContext);

    async function onAdd() {
        const name = await PromptService.create({
            text: Localize("tagName"),
            onValidate(value) {
                if (config?.tags.some(t => t.name == value)) {
                    return {
                        text: Localize("thisNameAlreadyUsed"),
                        severity: "danger"
                    }
                }
            },
        });

        if (name)
            invoke.setTag({
                name, color: "#000000",
                packageIds: []
            });
    }
    async function onRemove(tag: ModTag) {
        if (!await ConfirmService.create({ text: Localize("confirmDeletionTag") })) return
        invoke.removeTag(tag.name);
    }

    const CustomTag = React.useCallback(function ({ tag, transparent }: { tag: ModTag, transparent: boolean }) {
        return (
            <ModTag
                sx={{ opacity: transparent ? .25 : 1 }}
                tag={tag}
                key={tag.name}
                onClick={() => {
                    setTagsV(tagsV => {
                        if (tagsV.has(tag.name)) tagsV.delete(tag.name);
                        else tagsV.add(tag.name);
                        return new Set(tagsV);
                    });
                }}
            >
                <IconButton
                    size="sm"
                    variant="outlined"
                    onClick={onRemove.bind({}, tag)}
                >
                    <CloseIcon />
                </IconButton>
            </ModTag>
        )
    }, [tagsV, onAdd, onRemove]);

    return (
        <Stack
            spacing={1}
            alignItems="stretch"
            sx={{
                maxHeight: 160,
                overflow: "auto",
                px: 1
            }}
        >
            {config?.tags.map(tag => !(!!tagsV.size && !tagsV.has(tag.name)) && <CustomTag key={tag.name} tag={tag} transparent={false} />)}
            {config?.tags.map(tag => !!tagsV.size && !tagsV.has(tag.name) && <CustomTag key={tag.name} tag={tag} transparent={true} />)}
            <IconButton variant="outlined" onClick={onAdd}>{Localize("add")}</IconButton>
        </Stack>
    )
}