type ShortVersion = `${number}.${number}`;
type FullVersion = `${number}.${number}.${number}`;
type PackageId = `$PackageIdType$`;
// type PackageId = `$PackageIdType_Lower$`;
type XMLList<T> = { li: T[] }

interface XML_ModsConfig {
    version: FullVersion,
    activeMods: XMLList<PackageId>,
    knownExpansions: XMLList<PackageId>
}

interface XML_ModMetaData {
    name: string
    packageId: PackageId
    author?: string
    url?: string
    supportedVersions?: XMLList<ShortVersion>
    modDependencies?: XMLList<{
        displayName: string
        packageId: string
        steamWorkshopUrl: string
    }>

    loadBefore?: XMLList<PackageId>
    loadAfter?: XMLList<PackageId>
    forceLoadBefore?: XMLList<PackageId>;
    forceLoadAfter?: XMLList<PackageId>;

    incompatibleWith?: XMLList<PackageId>
    modVersion?: FullVersion,
    description?: string
}

interface ModInfo {
    type: "Steam" | "DLC" | "Local",
    dirPath: string,
    previewPath?: string,
    about: ModMetaData2,
    steamId?: string,
}

interface ModPackInfo {
    path: string,
    name: string,
    modCount: number,
    DLC: string[],
    version: FullVersion
}
interface GameInfo {
    gameVersionShort: ShortVersion,
    gameVersionFull: FullVersion,
    gamePath: string,
}





interface ModListErrorReport {
    mod: ModInfo
    errors: {
        // supportedVersions?: XMLList<ShortVersion>
        modDependencies?: (ModInfo | (ModMetaData2["modDependencies"] & {})[number])[]
        loadBefore?: ModInfo[]
        loadAfter?: ModInfo[]
        incompatibleWith?: ModInfo[]
    }
}





type ReturnedData<D = any> =
    | { success: true, data?: D }
    | { success: false, message: string, fatal: boolean }