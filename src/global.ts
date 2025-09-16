import type { ModType } from "./enums";



declare global {
    type ShortVersion = `${number}.${number}`;
    type FullVersion = `${number}.${number}.${number}`;
    type PackageId = `$${(string & {})}$`;
    // type PackageId = `$PackageIdType_Lower$`;
    type XMLList<T> = { li: T[] }




    type Result<T, F = ProblemByPath> =
        | { success: true, data: T }
        | { success: false, error: F }
        
    interface ProblemByPath {
        dirPath: string,
        message: string,
    }

    //#region ModReadingResult
    type ModReadingResult = Result<ModReadingInfo_ALL, ModReadingProblem>;

    interface ModReadingProblem extends ProblemByPath {
        modinfo?: ModReadingInfo_ALL
    }


    interface ModReadingInfo_BASE<T extends ModType = ModType> {
        type: T,
        dirPath: string,
        about: ModMetaData,
        previewPath?: string,
        iconPath?: string,
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
        gitinfo: Result<GitInfo>;
    }
    //#endregion




    interface ModPackInfo {
        dirPath: string,
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
    interface GitInfoRequest_GitHub_api {
        "oid": "4cfc023464459d9e4a38b12a4dc662a6d0735d91",
        "url": "/CombatExtended-Continued/CombatExtended/commit/4cfc023464459d9e4a38b12a4dc662a6d0735d91",
        "date": "2025-08-20T22:07:01.000-04:00",
        "shortMessageHtmlLink": "<a data-pjax=\"true\" class=\"Link--secondary\" href=\"/CombatExtended-Continued/CombatExtended/commit/4cfc023464459d9e4a38b12a4dc662a6d0735d91\">Merge pull request</a> <a class=\"issue-link js-issue-link\" data-error-text=\"Failed to load title\" data-id=\"3335188688\" data-permission-text=\"Title is private\" data-url=\"https://github.com/CombatExtended-Continued/CombatExtended/issues/4182\" data-hovercard-type=\"pull_request\" data-hovercard-url=\"/CombatExtended-Continued/CombatExtended/pull/4182/hovercard\" href=\"https://github.com/CombatExtended-Continued/CombatExtended/pull/4182\">#4182</a> <a data-pjax=\"true\" class=\"Link--secondary\" href=\"/CombatExtended-Continued/CombatExtended/commit/4cfc023464459d9e4a38b12a4dc662a6d0735d91\">from SaltyKarl/volt</a>",
        "bodyMessageHtml": "Patch Volt Weaponry",
        "author": {
            "displayName": "N7Huntsman",
            "login": "N7Huntsman",
            "path": "/N7Huntsman",
            "avatarUrl": "https://avatars.githubusercontent.com/u/38633594?s=40&v=4"
        },
        "authors": [
            {
                "login": "N7Huntsman",
                "displayName": "N7Huntsman",
                "avatarUrl": "https://avatars.githubusercontent.com/u/38633594?v=4",
                "path": "/N7Huntsman",
                "isGitHub": false
            }
        ],
        "committerAttribution": false,
        "committer": {
            "login": "web-flow",
            "displayName": "GitHub",
            "avatarUrl": "https://avatars.githubusercontent.com/u/19864447?v=4",
            "path": "/web-flow",
            "isGitHub": true
        },
        "pusher": null,
        "pushedDate": null,
        "status": "success",
        "isSpoofed": false
    }
}