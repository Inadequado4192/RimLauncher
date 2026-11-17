import { PackageIdLower } from "#features/app/shared";
import { LocalKey } from "#features/localization/shared";
import { ModEntry } from "#features/mod-type/shared";


export enum IssueSeverity {
    Warn = "WARN",
    Error = "ERROR",
}

export interface ModReference {
    displayName: string,
    packageId: string,
    steamWorkshopUrl?: string,
    downloadUrl?: string,
}

export interface ModIssue {
    severity: IssueSeverity,
    message: LocalKey,
    relatedMods?: ModEntry[],
    relatedModsRef?: ModReference[],
}
export type ModIssuesMap = Record<PackageIdLower, ModIssue[]>;