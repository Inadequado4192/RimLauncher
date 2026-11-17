// features/mod-core/renderer/store/derivedMods.ts
import { create } from "zustand";
import { useModsConfig } from "#features/mods-config/renderer";
import { useGameInfo } from "#features/game-info/renderer";
import { PackageIdAny, PackageIdLower } from "#features/app/shared";
import { ModEntry } from "#features/mod-type/shared";
import { IssueSeverity, ModIssue, ModIssuesMap, ModReference } from "../types";
import { useModList } from "./modListStore";
import { samePackageId } from "#features/mod-core/shared";
import { useMemo } from "react";

interface DerivedModsState {
    enabledMods: ModEntry[];
    disabledMods: ModEntry[];
    unknownPackageIds: PackageIdLower[];
    duplicates: Map<PackageIdLower, ModEntry[]>;
    staticIssues: ModIssuesMap;
    activeIssues: ModIssuesMap;
}

export const useDerivedMods = create<DerivedModsState>()(() => ({
    enabledMods: [],
    disabledMods: [],
    unknownPackageIds: [],
    duplicates: new Map(),
    staticIssues: {},
    activeIssues: {},
}));

export function useIssuesSeverity(): IssueSeverity | null {
    const staticIssues = useDerivedMods((s) => s.staticIssues);
    const activeIssues = useDerivedMods((s) => s.activeIssues);
    const hasUnknown = useDerivedMods((s) => s.unknownPackageIds.length > 0);

    return useMemo(() => {
        if (hasUnknown) return IssueSeverity.Error;
        let warn = false;
        for (const map of [activeIssues, staticIssues]) {
            for (const issues of Object.values(map)) {
                for (const issue of issues) {
                    if (issue.severity === IssueSeverity.Error) return IssueSeverity.Error;
                    if (issue.severity === IssueSeverity.Warn) warn = true;
                }
            }
        }
        return warn ? IssueSeverity.Warn : null;
    }, [staticIssues, activeIssues, hasUnknown]);
}


const key = (id: PackageIdAny) => id.toLowerCase() as PackageIdLower;
const EMPTY: readonly PackageIdLower[] = [];
const sameArray = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameDuplicates = (a: Map<string, ModEntry[]>, b: Map<string, ModEntry[]>) =>
    a.size === b.size &&
    [...a].every(([k, group]) => {
        const other = b.get(k);
        return !!other && sameArray(group, other);
    });
function addIssue(map: ModIssuesMap, mod: ModEntry, issue: ModIssue) {
    (map[key(mod.about.packageId)] ??= []).push(issue);
}




// ============================================================
// 3. ЧИСТІ ФУНКЦІЇ: беруть дані, повертають результат.
//    Стори тут не читаються, тому їх легко зрозуміти й тестувати.
// ============================================================

/** Знаходить моди з однаковим packageId. Повертає лише групи, де мод більше одного. */
function findDuplicates(mods: ModEntry[]): Map<PackageIdLower, ModEntry[]> {
    const groups = new Map<PackageIdLower, ModEntry[]>();
    for (const mod of mods) {
        const k = key(mod.about.packageId);
        const group = groups.get(k);
        if (group) group.push(mod);
        else groups.set(k, [mod]);
    }
    for (const [k, group] of groups) if (group.length < 2) groups.delete(k);
    return groups;
}

function splitMods(mods: ModEntry[], activeMods: readonly PackageIdLower[]) {
    const byId = new Map<PackageIdLower, ModEntry>();
    for (const mod of mods) {
        const k = key(mod.about.packageId);
        if (!byId.has(k)) byId.set(k, mod);
    }

    const enabled: ModEntry[] = [];
    const unknown: PackageIdLower[] = [];
    const activeSet = new Set<PackageIdLower>();

    for (const id of activeMods) {
        const k = key(id);
        if (activeSet.has(k)) continue;
        activeSet.add(k);

        const mod = byId.get(k);
        if (mod) enabled.push(mod);
        else unknown.push(k);
    }


    const disabled = [...byId.values().filter((m) => !activeSet.has(key(m.about.packageId)))];
    return { enabled, disabled, unknown };
}

function computeStaticIssues(
    mods: ModEntry[],
    gameVersion: string | undefined,
    duplicates: Map<PackageIdLower, ModEntry[]>,
): ModIssuesMap {
    const result: ModIssuesMap = {};


    if (gameVersion) {
        for (const mod of mods) {
            const supported = mod.about.supportedVersions;
            if (!supported) {
                if (!samePackageId("ludeon.rimworld" as PackageIdAny, mod))
                    addIssue(result, mod, { severity: IssueSeverity.Warn, message: "mods.issues.missingVersion" });
            } else if (!supported.includes(gameVersion)) {
                addIssue(result, mod, { severity: IssueSeverity.Warn, message: "mods.issues.wrongVersion" });
            }
        }
    }

    for (const group of duplicates.values()) {
        for (const mod of group) {
            addIssue(result, mod, {
                severity: IssueSeverity.Warn,
                message: "mods.issues.duplicate",
                relatedMods: group.filter((other) => other !== mod),
            });
        }
    }

    return result;
}

function computeActiveIssues(enabled: ModEntry[], disabled: ModEntry[]): ModIssuesMap {
    const result: ModIssuesMap = {};

    // таблиці для швидкого пошуку за id (замість indexOf у циклі)
    const position = new Map<PackageIdLower, number>();     // id -> місце в списку активних
    enabled.forEach((m, i) => position.set(key(m.about.packageId), i));
    const enabledById = new Map(enabled.map((m) => [key(m.about.packageId), m]));
    const disabledById = new Map(disabled.map((m) => [key(m.about.packageId), m]));

    enabled.forEach((mod, index) => {
        const self = key(mod.about.packageId);
        const about = mod.about;

        // 1) Відсутні залежності
        if (about.modDependencies?.length) {
            const inDisabled: ModEntry[] = [];          // залежність є, але вимкнена
            const notInstalled: ModReference[] = []; // залежності немає взагалі
            for (const dep of about.modDependencies) {
                const id = key(dep.packageId);
                if (id === self || position.has(id)) continue;   // все гаразд
                const off = disabledById.get(id);
                if (off) inDisabled.push(off);
                else notInstalled.push(dep);
            }
            if (inDisabled.length || notInstalled.length) {
                addIssue(result, mod, {
                    severity: IssueSeverity.Error,
                    message: "mods.issues.missingDependencies",
                    relatedMods: inDisabled,
                    relatedModsRef: notInstalled,
                });
            }
        }

        // 2) Несумісні моди, які теж увімкнені
        if (about.incompatibleWith?.length) {
            const conflicts: ModEntry[] = [];
            for (const pid of about.incompatibleWith) {
                const id = key(pid);
                const other = id === self ? undefined : enabledById.get(id);
                if (other && !conflicts.includes(other)) conflicts.push(other);
            }
            if (conflicts.length) {
                addIssue(result, mod, {
                    severity: IssueSeverity.Error,
                    message: "mods.issues.incompatibleWith",
                    relatedMods: conflicts,
                });
            }
        }

        // 3) loadAfter: твоя семантика збережена (помилка, якщо вказаний мод стоїть ПІСЛЯ поточного)
        if (about.loadAfter?.length) {
            const wrong: ModEntry[] = [];
            for (const pid of about.loadAfter) {
                const i = position.get(key(pid));
                if (i !== undefined && i > index) wrong.push(enabled[i]!);
            }
            if (wrong.length) {
                addIssue(result, mod, {
                    severity: IssueSeverity.Error,
                    message: "mods.issues.loadAfter",
                    relatedMods: wrong,
                });
            }
        }

        // 4) loadBefore: помилка, якщо вказаний мод стоїть ПЕРЕД поточним
        if (about.loadBefore?.length) {
            const wrong: ModEntry[] = [];
            for (const pid of about.loadBefore) {
                const i = position.get(key(pid));
                if (i !== undefined && i < index) wrong.push(enabled[i]!);
            }
            if (wrong.length) {
                addIssue(result, mod, {
                    severity: IssueSeverity.Error,
                    message: "mods.issues.loadBefore",
                    relatedMods: wrong,
                });
            }
        }
    });

    return result;
}















/** mods + activeMods  ->  списки, невідомі id, проблеми активних */
function recomputeLists() {
    const mods = useModList.getState().mods;
    if (!mods) return;
    const activeMods = useModsConfig.getState().config?.activeMods ?? EMPTY;
    const { enabled, disabled, unknown } = splitMods(mods, activeMods);

    const prev = useDerivedMods.getState();
    const patch: Partial<DerivedModsState> = {};

    const enabledSame = sameArray(prev.enabledMods, enabled);
    const disabledSame = sameArray(prev.disabledMods, disabled);

    if (!enabledSame) patch.enabledMods = enabled;
    if (!disabledSame) patch.disabledMods = disabled;
    if (!enabledSame || !disabledSame) patch.activeIssues = computeActiveIssues(enabled, disabled);
    if (!sameArray(prev.unknownPackageIds, unknown)) patch.unknownPackageIds = unknown;

    if (Object.keys(patch).length) useDerivedMods.setState(patch);
}

/** mods + версія гри  ->  дублікати та статичні проблеми */
function recomputeStatic() {
    const mods = useModList.getState().mods;
    if (!mods) return;
    const gameVersion = useGameInfo.getState().info?.gameVersionShort;

    const duplicates = findDuplicates(mods);
    const prev = useDerivedMods.getState();

    useDerivedMods.setState({
        duplicates: sameDuplicates(prev.duplicates, duplicates) ? prev.duplicates : duplicates,
        staticIssues: computeStaticIssues(mods, gameVersion, duplicates),
    });
}




export function initDerivedMods() {
    recomputeLists();
    recomputeStatic();

    const unsubs = [
        useModList.subscribe((s) => s.mods, () => {
            recomputeLists();
            recomputeStatic();
        }),
        useModsConfig.subscribe((s) => s.config?.activeMods, recomputeLists),
        useGameInfo.subscribe((s) => s.info, recomputeStatic),
    ];

    return () => unsubs.forEach((u) => u());
}