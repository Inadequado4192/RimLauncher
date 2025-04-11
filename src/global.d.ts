type ShortVersion = `${number}.${number}`;
type FullVersion = `${number}.${number}.${number}`;
type PackageId = `$PackageIdType$`;
// type PackageId = `$PackageIdType_Lower$`;
type XMLList<T> = { li: T[] }


interface Warning {
    dirPath: string,
    message: string
}

interface ModInfo {
    type: "Steam" | "DLC" | "Local",
    dirPath: string,
    about: ModMetaData_Schema,
    previewPath?: string,
    steamId?: string,
    warnings: Warning[],
}
interface ModInfoWarning {
    warnings: Warning[];
    type?: undefined;
    dirPath?: undefined;
    previewPath?: undefined;
    about?: undefined;
    steamId?: undefined;
}
type ModInfoWithWarning = ModInfo | ModInfoWarning

interface ModPackInfo {
    path: string,
    name: string,
    modCount: number,
    DLC: string[],
    version: string
}
interface GameInfoData {
    gameVersionShort: ShortVersion,
    gameVersionFull: FullVersion,
    gamePath: string,
}





// interface ModListErrorReport {
//     mod: C_ModMetaData
//     errors: {
//         // supportedVersions?: XMLList<ShortVersion>
//         modDependencies?: (C_ModMetaData | (ModMetaData_Schema["modDependencies"] & {})[number])[]
//         loadBefore?: C_ModMetaData[]
//         loadAfter?: C_ModMetaData[]
//         incompatibleWith?: C_ModMetaData[]
//     }
// }





type ReturnedData<D = any> =
    | { success: true, data?: D }
    | { success: false, message: string, fatal: boolean }