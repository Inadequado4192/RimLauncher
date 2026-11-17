import { Box, Sheet, Stack, Table, Typography } from "@mui/joy";
import { useLocalize } from "#features/localization/renderer";
import { memo, ReactNode, useMemo } from "react";
import { toModFileUrl } from "#features/mod-core/shared";
import { useGameInfo } from "#features/game-info/renderer";
import { ModActions } from "./ModActions";
import { ModEntry } from "#features/mod-type/shared";
import { useModListView } from "../store";

export function ModInfo() {
    const selectedMod = useModListView(s => [...s.selectedMods][0]);

    if (selectedMod) return <Info mod={selectedMod} />
    else return <ModChoiceScreen />
}


function ModChoiceScreen() {
    const t = useLocalize();

    return (
        <Sheet variant="soft" sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: .25,
            userSelect: "none"
        }}>
            <Typography level="h1" textAlign={"center"} letterSpacing={8}>{t("mods.modInfo.selectMod")}</Typography>
        </Sheet>
    )
}

function Info({ mod }: { mod: ModEntry }) {

    return (
        <Stack
            gap={1}
            flex={1}
            sx={{
                overflowY: "auto",
                overflowX: "hidden",
            }}
        >
            <Preview mod={mod} />
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
                <h4 style={{ margin: 0 }}>{mod.about.name}</h4>
                <ModActions mod={mod} />
            </Stack>
            <InfoTable mod={mod} />
            <p style={{ fontSize: ".8em", margin: 0 }}>{mod.about.description}</p>
        </Stack>
    )
}


function DataRow({ label, value, title }: { label: string, value: ReactNode, title?: string }) {
    return (
        <tr>
            <td width={150}>
                <span
                    style={{
                        color: "var(--joy-palette-text-tertiary)"
                    }}
                >{label}</span>
            </td>
            <td title={title}>{value}</td>
        </tr>
    )
}

const Preview = memo(function Preview({ mod }: { mod: ModEntry }) {
    if (!mod.previewPath) return null;

    return (
        <Box component="img"
            src={toModFileUrl(mod.previewPath)}
            width="100%"
            maxHeight={150}
            draggable={false}
            sx={{
                objectFit: "contain"
            }}
        />
    )
});


function MemoChip({ success, label }: { success: boolean, label: string }) {
    const color = success ? "success" : "danger";
    return (
        <span
            style={{
                fontSize: 10,
                display: "flex",
                color: `var(--joy-palette-${color}-outlinedColor)`,
                background: "var(--joy-palette-background-surface)",
                paddingLeft: 16,
                paddingRight: 16,
                borderRadius: "1.5rem",
                border: "1px solid",
                borderColor: `var(--joy-palette-${color}-outlinedBorder)`
            }}
        >{label}</span>
    )
};

const TABLE_SX = { "--unstable_TableCell-height": 16 };
const STACK_SX = { userSelect: "none" };
const InfoTable = memo(function InfoTable({ mod }: { mod: ModEntry }) {
    const t = useLocalize();
    const gVer = useGameInfo(s => s.info?.gameVersionShort);
    const supportedVersions = useMemo(() => {
        const versions = mod?.about.supportedVersions;
        if (!versions || versions.length === 0) return [];
        return [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }, [mod]);

    return (
        <Table
            size="sm"
            sx={TABLE_SX}
        >
            <tbody>
                <DataRow label="PackageId" value={mod.about.packageId} title={mod.about.packageId} />
                {mod.about.modVersion && <DataRow label={t("common.fields.version")} value={mod.about.modVersion} />}
                <DataRow label={t("mods.details.authors")} value={mod.about.author} />
                {supportedVersions.length > 0 && <DataRow
                    label={t("mods.details.supportedVersions")}
                    value={
                        <Stack direction="row" gap={1} flexWrap="wrap" sx={STACK_SX}>
                            {supportedVersions.map(v => <MemoChip key={v} label={v} success={v === gVer} />)}
                        </Stack>
                    }
                />}
            </tbody>
        </Table>
    )
});