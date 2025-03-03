import { Button, Divider, Modal, Stack, Typography } from "@mui/joy";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ClearIcon from "@mui/icons-material/Clear";
import React from "react";
import MainBody from "./MainBody";
import ModPackListWindowModal from "@Windows/ModPackListWindowModal";
import MyltiplayerCompabilityModal from "@Windows/MyltiplayerCompabilityModal";
import { LocalContext } from "@Context/LocalContext";
import Localize from "@common/Localize";

export default function ModListActions() {

    return (
        <Stack flex={0} sx={{ whiteSpace: "nowrap" }} gap={1}>
            <Divider><Typography>{Localize("windows")}</Typography></Divider>
            <OpenPacks />
            <MultiplayerCompability />

            <Divider><Typography>{Localize("modList")}</Typography></Divider>
            <Sort />
            <ClearActiveMods />

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
    const context = React.useContext(MainBody.Context);

    function onSort() {
        if (!context.sortedMods) return;
        const result = trySortMods(context.sortedMods.actives.map(a => ({
            name: a.about.name,
            packageId: a.about.packageId,
            forceLoadAfter: a.about.forceLoadAfter ?? [],
            forceLoadBefore: a.about.forceLoadBefore ?? [],
            loadAfter: a.about.loadAfter ?? [],
            loadBefore: a.about.loadBefore ?? [],
            samePackageId
        }))).map(a => a?.packageId as PackageId);
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


function samePackageId(this: { packageId: string }, otherPackageId: string, ignorePostfix = false) {
    if (this.packageId == null) {
        throw Error("???");

        return false;
    }
    if (ignorePostfix) {
        return this.packageId == otherPackageId.toLowerCase();
    }
    return this.packageId == otherPackageId.toLowerCase();
}



type ModMetaData = {
    packageId: PackageId | PackageId;
    name: string;
    loadBefore: string[];
    loadAfter: string[];
    forceLoadBefore: string[];
    forceLoadAfter: string[];
    samePackageId: (id: string, ignorePostfix: boolean) => boolean;
};

class DirectedAcyclicGraph {
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
}

function trySortMods(activeModsInLoadOrder: ModMetaData[]) {
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
}