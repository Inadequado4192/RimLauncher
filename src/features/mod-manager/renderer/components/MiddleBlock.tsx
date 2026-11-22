import { useCallback, useMemo } from "react";
import { Stack, Divider, Typography, Button, IconButton, Badge, LinearProgress } from "@mui/joy";
import ClearIcon from "@mui/icons-material/Clear";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddIcon from "@mui/icons-material/Add";
import { useModList, useDerivedMods } from "#features/mod-core/renderer";
import { ipc } from "#features/base/renderer";
import { localize, useLocalize } from "#features/localization/renderer";
import { useModsConfig } from "#features/mods-config/renderer";
import { ModsConfigIpc } from "#features/mods-config/shared";
import { createPrompt, createDialog } from "#features/overlays/renderer";
import { ModPackListDialog } from "#features/mod-pack/renderer";
import { GitModsDialog, useGitModsUpdates } from "#features/git/renderer";
import { ModEntry } from "#features/mod-type/shared";
import { registeredMods } from "#features/mod-type/renderer";
import { ModTagChip } from "#features/mod-tag/renderer";
import { ModTagsConfigField, TagView, ModTagIpc } from "#features/mod-tag/shared";
import { useConfigSelector } from "#features/user-config/renderer";
import { useModListView } from "../store";
import { SteamUpdatesDialog, useSteamModsUpdates } from "#features/steam-updates/renderer";
import { samePackageId } from "#features/mod-core/shared";
import { ResultView } from "#features/ui-kit/renderer";

export function MiddleBlock() {
    const t = useLocalize();

    return (
        <Stack sx={{ whiteSpace: "nowrap", maxWidth: "25%" }} gap={1}>
            <Divider><Typography>{t("mods.list.sections.windows")}</Typography></Divider>
            <ModPacksButton />
            <GitButton />
            <SteamModsButton />


            <Divider><Typography>{t("mods.list.sections.modList")}</Typography></Divider>
            <Sort />
            <Button color="danger" onClick={() => ipc.invoke(ModsConfigIpc.ClearActives)} startDecorator={<ClearIcon />}>{t("mods.list.clearActive")}</Button>

            <Divider><Typography>{t("mods.list.sections.stats")}</Typography></Divider>
            <Stats />

            <Divider><Typography>{t("mods.list.sections.tags")}</Typography></Divider>
            <TagList />
        </Stack>
    );
}

function ModPacksButton() {
    const t = useLocalize();
    return <Button
        startDecorator={<ListAltIcon />}
        onClick={() => createDialog(close => <ModPackListDialog onClose={close} />)}
    >{t("modPacks.title")}</Button>
}

function GitButton() {
    const t = useLocalize();
    const notify = useGitModsUpdates();

    return (
        <Badge
            badgeInset={8}
            invisible={notify?.success && !notify.data.length}
            badgeContent={
                <ResultView
                    result={notify}
                    renderError={() => "!"}
                    loading={<LinearProgress size="sm" />}
                >{data => data.length}</ResultView>
            }
            color={!notify ? "neutral" : notify.success ? "primary" : "danger"}
            size="sm"
            sx={{ "& button": { flex: 1 } }}
            slotProps={{
                badge: {
                    sx: { pointerEvents: "none" }
                }
            }}
        >
            <Button
                startDecorator={<ListAltIcon />}
                onClick={() => createDialog((close) => <GitModsDialog onClose={close} />)}
            >{t("git.title")}</Button>
        </Badge>
    );
}

function SteamModsButton() {
    const t = useLocalize();
    const notify = useSteamModsUpdates();


    return (
        <Badge
            badgeInset={8}
            invisible={notify?.success && !notify.data.length}
            badgeContent={
                <ResultView
                    result={notify}
                    renderError={() => "!"}
                    loading={<LinearProgress size="sm" />}
                >{data => data.length}</ResultView>
            }
            color={!notify ? "neutral" : notify.success ? "primary" : "danger"}
            size="sm"
            sx={{ "& button": { flex: 1 } }}
            slotProps={{
                badge: {
                    sx: { pointerEvents: "none" }
                }
            }}
        >
            <Button
                startDecorator={<ListAltIcon />}
                onClick={() => createDialog(close => <SteamUpdatesDialog onClose={close} />)}
            >{t("steamUpdates.title")}</Button>
        </Badge>
    )
}


function Sort() {
    const t = useLocalize();
    const DirectedAcyclicGraph = useMemo(() => class DirectedAcyclicGraph {
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

    const trySortMods = useCallback(function trySortMods(activeModsInLoadOrder: ModEntry[]) {
        const list = [...activeModsInLoadOrder];
        const dag = new DirectedAcyclicGraph(list.length);

        for (let i = 0; i < list.length; i++) {
            const mod = list[i]!;

            for (const before of [...mod.about.loadBefore ?? [], ...mod.about.forceLoadBefore ?? []]) {
                const target = list.find(m => samePackageId(m, before, true));
                if (target) {
                    dag.addEdge(list.indexOf(target), i);
                }
            }

            for (const after of [...mod.about.loadAfter ?? [], ...mod.about.forceLoadAfter ?? []]) {
                const target = list.find(m => samePackageId(m, after, true));
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
        const { enabledMods } = useDerivedMods.getState();

        const result = trySortMods(enabledMods).map(a => a.about.packageId);
        ipc.invoke(ModsConfigIpc.SetMods, result);
    }
    return (
        <Button size="sm" onClick={onSort} startDecorator={<SwapVertIcon />}>{t("common.actions.sort")}</Button>
    )
}

function Stats() {
    const t = useLocalize();
    const mods = useModList(s => s.mods);
    const activeModsLength = useModsConfig(s => s.config?.activeMods.length);

    const byTypes = useMemo(() => {
        if (!mods) return null;

        const modsByType = new Map<string, number>();

        for (const mod of mods) {
            modsByType.set(mod.type, (modsByType.get(mod.type) ?? 0) + 1);
        }

        return [...registeredMods.values().map(modType => (
            <div key={modType.id} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <modType.icon />
                {modsByType.get(modType.id) ?? 0}
            </div>
        ))];
    }, [mods, registeredMods]);
    return (
        <Stack alignItems="center" gap={1}>
            <Typography>
                {mods && t("mods.list.activeCount", [activeModsLength, mods.length])}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={2} useFlexGap justifyContent="center">
                {byTypes}
            </Stack>
        </Stack>
    );
};


export function TagList() {
    const tags = useConfigSelector(
        ModTagsConfigField,
        (all): TagView[] => all.map(({ id, name, color }) => ({ id, name, color })),
        (a, b) =>
            a.length === b.length &&
            a.every((t, i) => t.id === b[i]!.id && t.name === b[i]!.name && t.color === b[i]!.color),
    );

    const filterByTags = useModListView(s => s.filterByTags);

    async function onAdd() {
        const name = await createPrompt({
            title: localize("common.fields.name")
        });

        if (name) ipc.invoke(ModTagIpc.Create, { name, color: "#ffffff" });
    }

    return (
        <Stack gap={1} px={1} overflow="auto">
            <Stack
                gap={1}
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
                {tags.map(t =>
                    <ModTagChip
                        key={t.id}
                        tag={t}
                        sx={{
                            opacity: !filterByTags.size || filterByTags.has(t.id) ? 1 : .5,
                        }}
                        onClick={() => useModListView.getState().toggleTagFilter(t.id)}
                    />)}
            </Stack>
            <IconButton variant="outlined" onClick={onAdd} size="sm"><AddIcon /></IconButton>
        </Stack>
    )
}