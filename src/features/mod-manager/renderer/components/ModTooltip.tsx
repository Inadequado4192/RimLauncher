import { useLocalize } from "#features/localization/renderer";
import { ModIssue, IssueSeverity } from "#features/mod-core/renderer";
import { openUrl } from "#features/system/renderer";
import { Stack, Divider, Typography, ListItemButton } from "@mui/joy";
import { ModActions } from "./ModActions";
import { ModTag, ModTagIpc } from "#features/mod-tag/shared";
import { ModTagChip } from "#features/mod-tag/renderer";
import { ipc } from "#features/base/renderer";
import { useModTags } from "../hooks";
import { ModEntry } from "#features/mod-type/shared";
import { samePackageId } from "#features/mod-core/shared";
import { useModListView } from "../store";

export function ModTooltip({ mod, issues }: {
    mod: ModEntry,
    issues?: ModIssue[]
}) {
    return (
        <Stack spacing={2} p={1} divider={<Divider />} maxWidth={500}>
            {issues?.map((i, index) => <IssueComponent key={index} issue={i} />)}
            <ModActions mod={mod} />
            <ModTags mod={mod} />
        </Stack>
    )
}

function IssueComponent({ issue }: { issue: ModIssue }) {
    const t = useLocalize();

    return (
        <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography color={issue.severity === IssueSeverity.Warn ? "warning" : "danger"} level="body-sm">{t(issue.message)}</Typography>
            </Stack>
            {issue.relatedMods?.map(m =>
                <ListItemButton
                    key={m.about.packageId}
                    sx={{ px: 1, py: .5 }}
                    onClick={() => useModListView.getState().selectMods([m])}
                >
                    <Typography level="body-xs">{m.about.name}</Typography>
                </ListItemButton>
            )}
            {issue.relatedModsRef?.map(ref =>
                <ListItemButton
                    key={ref.packageId}
                    sx={{ px: 1, py: .5 }}
                    onClick={() => ref.steamWorkshopUrl && openUrl(ref.steamWorkshopUrl)}
                >
                    <Typography level="body-xs">
                        ※ {ref.displayName}
                        <br />
                        <Typography level="body-xs" sx={{ opacity: .3 }}>{ref.packageId}</Typography>
                    </Typography>

                </ListItemButton>
            )}
        </Stack>
    )
}

function ModTags({ mod }: { mod: ModEntry }) {
    const { disabled, enabled } = useModTags(mod);


    function enable(tag: ModTag) {
        ipc.invoke(ModTagIpc.Patch, tag.id, {
            packageIds: [...new Set([...tag.packageIds, mod.about.packageId])]
        });
    }

    function disable(tag: ModTag) {
        ipc.invoke(ModTagIpc.Patch, tag.id, {
            packageIds: tag.packageIds.filter(p => !samePackageId(mod, p))
        });
    }


    return (
        <Stack gap={1}>
            <Stack
                gap={1}
                useFlexGap
                direction="row"
                flexWrap="wrap"
            >
                {enabled.map(t => <ModTagChip key={t.id} tag={t} onClick={() => disable(t)} />)}
            </Stack>
            <Stack
                gap={1}
                useFlexGap
                direction="row"
                flexWrap="wrap"
                sx={{ opacity: .5 }}
            >
                {disabled.map(t => <ModTagChip key={t.id} tag={t} onClick={() => enable(t)} />)}
            </Stack>
        </Stack>
    )
}
