import type Schemes from "main/Schemes";
import type { ModType } from "./enums";
import { z } from "zod";
import type { GitSpace } from "@Common/libs/git";



declare global {
    type ShortVersion = `${number}.${number}`;
    type FullVersion = `${number}.${number}.${number}`;
    type PackageId = `$${(string & {})}$`;
    // type PackageId = `$PackageIdType_Lower$`;
    type XMLList<T> = { li: T[] }



    //#region ModReadingResult
    type ModReadingResult =
        | { success: true, data: ModReadingInfo_ALL }
        | { success: false, error: ModReadingProblem }
    interface ModReadingProblem {
        dirPath: string,
        message: string
    }

    interface ModReadingInfo_BASE<T extends ModType = ModType> {
        type: T,
        dirPath: string,
        about: ModMetaData,
        previewPath?: string,
        warnings: ModReadingProblem[],
    }
    type ModReadingInfo_ALL = ModReadingInfo_DLC | ModReadingInfo_Steam | ModReadingInfo_Local | ModReadingInfo_Git;
    interface ModReadingInfo_DLC extends ModReadingInfo_BASE<ModType.DLC> {
    }
    interface ModReadingInfo_Steam extends ModReadingInfo_BASE<ModType.Steam> {
        steamId: string | null,
    }
    interface ModReadingInfo_Local extends ModReadingInfo_BASE<ModType.Local> {
    }
    interface ModReadingInfo_Git extends ModReadingInfo_BASE<ModType.Git> {
        gitinfo: null | GitInfo;
        gitrepo: null | GitSpace.GitRepo
    }
    //#endregion




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


    type CreateResponse<D = any> =
        | ({ success: true } & (undefined extends D ? {} : { data: D }))
        | { success: false, error: string, }




    /**@deprecated */
    type DeepReadonly<T> = T;
    type DeepReadonly_<T> = T extends (...args: any[]) => any
        ? T
        : T extends Array<infer U>
        ? ReadonlyArray<DeepReadonly<U>>
        : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;







    interface GitInfoRequest_GitGud_api_graphql {
        "data": {
            "project": {
                "id": "gid://gitlab/Project/8372",
                "repository": {
                    "lastCommit": {
                        "id": "gid://gitlab/Commit/5c23d8145e853ca6db6249be9d05583a13596444",
                        "sha": "5c23d8145e853ca6db6249be9d05583a13596444",
                        "title": "5.6.4",
                        "titleHtml": "5.6.4",
                        "descriptionHtml": "",
                        "message": "5.6.4\n",
                        "webPath": "/Ed86/rjw/-/commit/5c23d8145e853ca6db6249be9d05583a13596444",
                        "committerName": "Ed86",
                        "committedDate": "2025-06-10T12:47:45+03:00",
                        "authorName": "Ed86"
                    }
                }
            }
        }
    }
}