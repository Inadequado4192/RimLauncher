import { PackageIdLower } from "#features/app/shared";
import { useLocalize } from "#features/localization/renderer";
import { IssueSeverity, useDerivedMods, useIssuesSeverity, useModList } from "#features/mod-core/renderer";
import { createDialog, hideTooltip, showTooltip } from "#features/overlays/renderer";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Button, DialogContent, ListItem, ListItemButton, ModalDialog, Stack } from "@mui/joy";
import { ComponentType, memo, useMemo, useState } from "react";
import { useModListView } from "../store";
import { LocalizedString, LocalKey } from "#features/localization/shared";
import { ModEntry } from "#features/mod-type/shared";
import { samePackageId } from "#features/mod-core/shared";
import { Virtuoso } from "react-virtuoso";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { ipc } from "#features/base/renderer";
import { ModsConfigIpc } from "#features/mods-config/shared";

export function AllIssues() {
    return (
        <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ "&>*": { flexGrow: 1 } }}
        >
            <IssuesButton />
        </Stack>
    )
}

function IssuesButton() {
    const t = useLocalize();
    const severity = useIssuesSeverity();

    if (!severity) return null;

    return (
        <Button color={severity === IssueSeverity.Warn ? "warning" : "danger"} onClick={() => createDialog(<IssuesDialog />)}>
            {t("common.fields.issues")}
        </Button>
    );
}


function IssuesDialog() {
    const t = useLocalize();
    const staticIssues = useDerivedMods((s) => s.staticIssues);
    const activeIssues = useDerivedMods((s) => s.activeIssues);
    const unknownPackageIds = useDerivedMods((s) => s.unknownPackageIds);
    const mods = useModList(s => s.mods);

    const [selectedBlockIndex, setІelectedBlockIndex] = useState<number | null>(null);

    const rows = useMemo(() => {
        const out = new Map<LocalKey, {
            mods: (ModEntry | PackageIdLower)[],
            severity: IssueSeverity,
            actions?: {
                label: LocalizedString,
                onClick: () => void,
                icon: ComponentType<{ onClick: () => void }>
            }[]
        }>();

        if (mods) {
            for (const map of [staticIssues, activeIssues]) {
                for (const [_packageId, list] of Object.entries(map)) {
                    const packageId = _packageId as PackageIdLower;
                    const mod = mods.find(m => samePackageId(m, packageId));
                    if (!mod) continue;

                    for (const issue of list) {
                        const m = issue.message;

                        (out.get(m) ?? out.set(m, {
                            mods: [],
                            severity: issue.severity
                        }).get(m)!).mods.push(mod);
                    }
                }
            }

            for (const packageId of unknownPackageIds) {
                const m: LocalKey = "mods.unknownPackageIds.title";

                (out.get(m) ?? out.set(m, {
                    mods: [],
                    severity: IssueSeverity.Error,
                    actions: [{
                        label: "mods.unknownPackageIds.message",
                        icon: CleaningServicesIcon,
                        onClick: () => ipc.invoke(ModsConfigIpc.DisableMods, useDerivedMods.getState().unknownPackageIds),
                    }]
                }).get(m)!).mods.push(packageId);
            }
        }

        return [...out.entries()]
    }, [staticIssues, activeIssues, unknownPackageIds, mods]);

    return (
        <ModalDialog minWidth="sm">
            <DialogContent>
                <AccordionGroup>
                    {rows.map(([localKey, info], index) =>
                        <Accordion
                            key={localKey}
                            color={info.severity === IssueSeverity.Error ? "danger" : "warning"}
                            variant="soft"
                            expanded={selectedBlockIndex === index}
                            onChange={(event, expanded) => {
                                setІelectedBlockIndex(expanded ? index : null);
                            }}
                        >
                            <AccordionSummary
                                slotProps={{
                                    button: {
                                        sx: info.actions?.length ? { cursor: "help" } : {}
                                    }
                                }}
                                onMouseLeave={() => hideTooltip()}
                                onContextMenu={(e) => {
                                    if (!info.actions?.length) return;
                                    showTooltip(e.currentTarget, info.actions?.map((a, i) => (
                                        <Button key={i} onClick={() => {
                                            a.onClick();
                                            hideTooltip();
                                        }} sx={{ whiteSpace: "wrap" }}>
                                            {t(a.label)}
                                        </Button>
                                    )))
                                }}
                            >
                                {t(localKey)} ({info.mods.length})
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: "var(--joy-palette-background-surface)" }}>
                                <Virtuoso
                                    data={info.mods}
                                    totalCount={info.mods.length}
                                    style={{
                                        maxHeight: 500,
                                        height: "100vh",
                                        overflowX: "hidden",
                                    }}
                                    computeItemKey={(_, m) => typeof m === "string" ? m : m.about.packageId}
                                    itemContent={(index, m) => <ModListItem m={m} />}
                                />
                            </AccordionDetails>
                        </Accordion>
                    )}
                </AccordionGroup>
            </DialogContent>
        </ModalDialog>
    );
}

const ModListItem = memo(function ModListItem({ m }: { m: ModEntry | PackageIdLower }) {
    return (
        <ListItem>
            <ListItemButton onClick={() => typeof m !== "string" && useModListView.getState().selectMods([m])}>
                {typeof m === "string" ? m : m.about.name}
            </ListItemButton>
        </ListItem>
    )
});