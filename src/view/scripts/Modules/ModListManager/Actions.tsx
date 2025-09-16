import React, { JSX } from "react";
import { Badge, Button, Divider, IconButton, Stack, Typography } from "@mui/joy";
//#region Icons
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
//#endregion
import ModPackListWindowModal from "@Windows/ModPackList/ModPackListWindowModal";
import Localize from "@Common/Localize";
import { Mod } from "@Classes/Mod";
import { PromptService } from "@Services/Prompt";
import GitModsModal from "@Windows/GitMods/Modal";
import useGitModsNotify from "@Windows/GitMods/Notify";
import ModTag from "@Renderer/scripts/Components/ModTag";
import Tag from "@Renderer/scripts/Classes/Tag";
import { __ModListStores__, } from "./__ModListStore__";
import { SxProps } from "@mui/material";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";


export default function Actions() {
    return (
        <Stack sx={{ whiteSpace: "nowrap" }} gap={1}>
            <Divider><Typography>{Localize("sections.windows")}</Typography></Divider>
            <OpenPacks />
            <GitMods />

            <Divider><Typography>{Localize("sections.modList")}</Typography></Divider>
            <Sort />
            <ClearActiveMods />

            <Divider><Typography>{Localize("sections.stats")}</Typography></Divider>
            <Stats />

            <Divider><Typography>{Localize("sections.tags")}</Typography></Divider>
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
            <Button onClick={onLoad} startDecorator={<ListAltIcon />}>{Localize("mods.modPacks")}</Button>
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
                <Button size="sm" onClick={onOpen} startDecorator={<ListAltIcon />} sx={{ flexGrow: 1 }}>Git</Button>
            </Badge>
            <GitModsModal open={isOpen} onClose={onClose} gitModsDialogParams={notify.params} />
        </>
    )
}
//#endregion



//#region ModList
function Sort() {
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
        const result = trySortMods([...__ModListStores__.enabled.get()]).map(a => a.about.packageId);
        $invoke.setActiveMods(result);
    }
    return (
        <Button size="sm" onClick={onSort} startDecorator={<SwapVertIcon />}>{Localize("actions.sort")}</Button>
    )
}
function ClearActiveMods() {
    return (
        <Button size="sm" color="danger" onClick={() => $invoke.clearModsConfig()} startDecorator={<ClearIcon />}>{Localize("mods.clearActiveMods")}</Button>
    )
}
//#endregion









function Stats() {
    const Count = React.useCallback(React.memo(function Count() {
        const activesLength = __ModListStores__.enabled.use(l => l.length);
        const modsLength = __GlobalStores__.mods.use(l => Object.keys(l).length);

        return Localize("mods.activeMods", [activesLength, modsLength]);
    }), []);

    const ByTypes = React.useCallback(React.memo(function ByTypes() {
        const mods = __GlobalStores__.mods.use();
        const sortedByType = React.useMemo(() => {
            const map = new Map<number, { count: number, icon: JSX.Element }>();

            for (const pid in mods) {
                const mod = mods[pid as PackageId]!;
                const type = mod.type;
                if (map.has(type)) {
                    const val = map.get(type)!;
                    val.count++;
                    map.set(type, val);
                } else {
                    map.set(type, { count: 1, icon: mod.getTypeIcon({ fontSize: "small" }) });
                }
            }

            return map;
        }, [mods]);

        return (
            [...sortedByType.entries().map(([type, { count, icon }]) => (
                <div key={type} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {icon}
                    {count}
                </div>
            ))]
        )
    }), []);

    return (
        <Stack alignItems="center" gap={1}>
            <Typography>
                <Count />
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={2} useFlexGap justifyContent="center">
                <ByTypes />
            </Stack>
        </Stack>
    )
};


function TagList() {

    async function onAdd() {
        const allTags = __ModListStores__.tags.get()
        const name = await PromptService.create({
            text: Localize("common.name"),
            onValidate: (value) => allTags.some(t => t.name == value) ? Localize("common.validation.thisNameAlreadyUsed") : true,
        }).endPromise;

        if (name) {
            $invoke.addTag({
                name, color: "#000000",
                packageIds: []
            });
        }
    }

    const TagComp = React.useCallback(function TagComp({ tag }: { tag: Tag }) {
        const disabled = __ModListStores__.filterByTags.use(ts => !!ts.size && !ts.has(tag));

        const onClick = React.useCallback(() => {
            __ModListStores__.filterByTags.update(ts => {
                if (ts.has(tag)) ts.delete(tag);
                else ts.add(tag);
            });
        }, []);
        const sx: SxProps = React.useMemo(() => ({
            opacity: disabled ? .5 : 1
        }), [disabled]);

        return <ModTag
            tag={tag}
            onClick={onClick}
            sx={sx}
        />;
    }, []);



    const TagList = React.useCallback(function TagList() {
        const [allTags, setAllTags] = React.useState<Tag[]>();
        React.useEffect(() => {
            setAllTags(__ModListStores__.tags.get());
            return __ModListStores__.tags.subscribe(() => {
                setAllTags(__ModListStores__.tags.get());
            });
        }, []);

        return allTags && [...allTags].map(tag => <TagComp key={tag.name} tag={tag} />)
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
                    "& > button": {
                        flexGrow: 1,
                    }
                }}
            >
                <TagList />
            </Stack>
            <IconButton variant="outlined" onClick={onAdd} size="sm"><AddIcon /></IconButton>
        </Stack>
    )
}