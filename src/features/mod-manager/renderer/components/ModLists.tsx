import { Stack, CircularProgress, List } from "@mui/joy";
import { memo, JSX, useMemo, useEffect, useRef } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useDerivedMods, ModIssuesMap, useModList } from "#features/mod-core/renderer";
import { ModListItem } from "./ModListItem";
import { useKeyControls } from "../hooks";
import { Search } from "./Search";
import { ListActions } from "./ListActions";
import { AllIssues } from "./AllIssues";
import { ModEntry } from "#features/mod-type/shared";
import { useModListView } from "../store";
import { useShallow } from "zustand/shallow";
import { useConfigField } from "#features/user-config/renderer";
import { ModTagsConfigField } from "#features/mod-tag/shared";


export function ModLists() {
    const versionIssues = useDerivedMods(s => s.staticIssues);
    const activeIssues = useDerivedMods(s => s.activeIssues);

    const versionAndActiveIssues = useMemo(() => ({ ...versionIssues, ...activeIssues }), [versionIssues, activeIssues])

    const { disabled, enabled } = useFilteredMods();

    useKeyControls({ disabled, enabled });

    return (
        <Stack gap={1}>
            <Search />
            <ListActions />

            <Stack
                id="lists"
                direction="row"
                gap={1}
                flex={1}
                overflow="hidden"
            >
                <MList issues={versionIssues} list={disabled} />
                <MList issues={versionAndActiveIssues} list={enabled} />
            </Stack>

            <AllIssues />
        </Stack>
    )
}

export function useFilteredMods() {
    const enabled = useDerivedMods((s) => s.enabledMods);
    const disabled = useDerivedMods((s) => s.disabledMods);
    const { searchD, searchE, splitSearch, filterByTags } = useModListView(
        useShallow((s) => ({
            searchD: s.searchD, searchE: s.searchE,
            splitSearch: s.splitSearch, filterByTags: s.filterByTags,
        })),
    );
    const tags = useConfigField(ModTagsConfigField);

    return useMemo(() => {
        const allowed = filterByTags.size
            ? new Set(tags.filter((t) => filterByTags.has(t.id)).flatMap((t) => t.packageIds.map((p) => p.toLowerCase())))
            : null;

        const pass = (m: ModEntry, text: string) =>
            m.about.name.toLowerCase().includes(text.toLowerCase()) &&
            (!allowed || allowed.has(m.about.packageId.toLowerCase()));

        return {
            enabled: enabled.filter((m) => pass(m, splitSearch ? searchE : searchD)),
            disabled: disabled.filter((m) => pass(m, searchD)),
        };
    }, [enabled, disabled, searchD, searchE, splitSearch, filterByTags, tags]);
}


function LoadingElement() {
    return (
        <Stack justifyContent="center" alignItems="center" sx={{ width: "100%", height: "100%" }}>
            <CircularProgress />
        </Stack>
    )
}






const MList = memo(function MList({ list, issues }: {
    list: ModEntry[],
    issues: ModIssuesMap,
}) {
    const isLoaded = useModList(s => !!s.mods);
    const virtuosoRef = useRef<VirtuosoHandle>(null);

    useEffect(() => {
        return useModListView.subscribe(({ cursor }) => {
            if (!cursor) return;

            const index = list.indexOf(cursor);
            if (index < 0) return;

            virtuosoRef.current?.scrollIntoView({ index });
        });
    }, [list]);

    let render: JSX.Element;

    if (!isLoaded) {
        render = <LoadingElement />;
    } else {
        render = (
            <Virtuoso
                ref={virtuosoRef}
                data={list}
                totalCount={list.length}
                style={{ flex: 1 }}
                computeItemKey={(_, m) => m.about.packageId}
                itemContent={(index, item) => (
                    <ModListItem
                        mod={item}
                        issue={issues[item.about.packageId]}
                    />
                )}
            />
        )
    }

    return (
        <List
            size="sm"
            variant="outlined"
            sx={{ flex: 1, overflow: "hidden" }}
        >
            {render}
        </List>
    )
});