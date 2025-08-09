import fs from "fs"
import path from "path";
import { parser } from "../utilts";
import Schemes from "../Schemes";
import { Pathes, PathesMaker } from "../Pathes";
import Localize from "@Common/Localize";
import { ModType } from "enums";
import { z } from "zod";
import { GitSpace } from "@Common/libs/git";


namespace ModListActions {
    // type ModReadingInfo = ReturnType<typeof getModFrom>;


    export function getModFrom(dirPath: string): ModReadingResult {
        const aboutDirPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(dirPath, "About"),
            path.join(dirPath, "about"),
        ]);




        if (!aboutDirPath) {
            return {
                success: false,
                error: {
                    dirPath,
                    message: Localize("notFound", ["./About"])
                }
            };
        }
        const aboutXmlPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "About.xml"),
            path.join(aboutDirPath, "about.xml"),
        ]);

        if (!aboutXmlPath) {
            return {
                success: false,
                error: {
                    dirPath,
                    message: Localize("notFound", ["About/About.xml"])
                }
            };
        }
        const xmlText = fs.readFileSync(aboutXmlPath).toString();
        const xml = parser.parse(xmlText);
        const result = Schemes.XML.ModMetaData(dirPath).safeParse(Object.values(xml).find(v => typeof v === "object")); // Finding ModMetaData
        if (!result.success) {
            return {
                success: false,
                error: {
                    dirPath,
                    message: `About.xml:\n${z.prettifyError(result.error)}`,
                }
            };
        }
        const about = result.data;


        const previewPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "Preview.png"),
            path.join(aboutDirPath, "preview.png"),
        ]);


        const warnings: ModReadingProblem[] = []
        const dirName = path.dirname(dirPath);
        const parentDir = path.basename(dirName);

        const gitInfoFilePath = path.join(dirPath, PathesMaker.gitinfo);

        let data: ModReadingInfo_ALL;
        if (parentDir === "Data") data = { type: ModType.DLC, dirPath, previewPath, about, warnings } satisfies ModReadingInfo_DLC;
        else if (parentDir === "294100") {
            const steamId: string | null =
                (p => fs.existsSync(p) ? fs.readFileSync(p).toString().trim() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt")) ??
                path.basename(dirPath).match(/^(\d+)$/)?.[0] ?? null;

            if (!steamId) {
                warnings.push({
                    dirPath,
                    message: Localize("missingSteamId")
                });
            }
            data = { type: ModType.Steam, steamId, dirPath, previewPath, about, warnings } satisfies ModReadingInfo_Steam;
        }
        else if (fs.existsSync(gitInfoFilePath)) {
            let gitinfo = null;
            let gitrepo: null | GitSpace.GitRepo = null
            try {
                const gitInfoRes = Schemes.GitInfo.safeParse(JSON.parse(fs.readFileSync(gitInfoFilePath).toString()));
                if (gitInfoRes.success) gitinfo = gitInfoRes.data;
                else warnings.push({ dirPath, message: `Wrong "${PathesMaker.gitinfo}" file` });
            } catch {
                warnings.push({ dirPath, message: `Wrong "${PathesMaker.gitinfo}" file` });
            }


            data = { type: ModType.Git, gitinfo, gitrepo, dirPath, previewPath, about, warnings } satisfies ModReadingInfo_Git;
        }
        else if (parentDir === "Mods") data = { type: ModType.Local, dirPath, previewPath, about, warnings } satisfies ModReadingInfo_Local;
        else throw Error("Wrong Path");

        return { success: true, data }
    }


    // export function getModFrom_V2(dirPath: string) {
    //     const warnings: ModLoadWarning[] = []
    //     const aboutDirPath = (ps => ps.find(p => fs.existsSync(p)))([
    //         path.join(dirPath, "About"),
    //         path.join(dirPath, "about"),
    //     ]);




    //     if (!aboutDirPath) {
    //         warnings.push({
    //             dirPath,
    //             message: Localize("fileNotFound", [path.join(dirPath, "About")])
    //         });
    //         return { warnings };
    //     }
    //     const aboutXmlPath = (ps => ps.find(p => fs.existsSync(p)))([
    //         path.join(aboutDirPath, "About.xml"),
    //         path.join(aboutDirPath, "about.xml"),
    //     ]);

    //     if (!aboutXmlPath) {
    //         warnings.push({
    //             dirPath,
    //             message: Localize("fileNotFound", [path.join(dirPath, "About/About.xml")])
    //         });
    //         return { warnings };
    //     }
    //     const xmlText = fs.readFileSync(aboutXmlPath).toString();
    //     const xml = parser.parse(xmlText);
    //     const result = Schemes.XML.ModMetaData(dirPath).safeParse(Object.values(xml).find(v => typeof v === "object")); // Finding ModMetaData
    //     if (!result.success) {
    //         warnings.push({
    //             dirPath,
    //             message: `About.xml:\n${JSON.stringify(result.error.errors, null, 4)}`,
    //         });
    //         return { warnings };
    //     }
    //     const about = result.data;


    //     const previewPath = (ps => ps.find(p => fs.existsSync(p)))([
    //         path.join(aboutDirPath, "Preview.png"),
    //         path.join(aboutDirPath, "preview.png"),
    //     ]);


    //     let steamId: string | undefined;
    //     if (type == ModType.Steam) {
    //         steamId =
    //             (p => fs.existsSync(p) ? fs.readFileSync(p).toString().trim() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt")) ??
    //             path.basename(dirPath).match(/^(\d+)$/)?.[0];

    //         if (!steamId) {
    //             warnings.push({
    //                 dirPath,
    //                 message: Localize("missingSteamId")
    //             });
    //         }
    //     }

    //     return { type, dirPath, previewPath, about, steamId, warnings } satisfies ModReadingInfo;
    // }

    export function getModList() {
        const data: {
            list: ModReadingInfo_ALL[],
            errors: ModReadingProblem[]
        } = { list: [], errors: [] };

        function ReadDir(folderPath: string) {
            if (!fs.existsSync(folderPath)) return;
            for (const folderName of fs.readdirSync(folderPath)) {
                const fPath = path.join(folderPath, folderName);
                if (!fs.lstatSync(fPath).isDirectory()) continue;

                const result = getModFrom(fPath);
                if (result.success) data.list.push(result.data);
                else data.errors.push(result.error);
            }
        }

        if (Pathes.Dir_GameWorkshop) {
            ReadDir(Pathes.Dir_GameWorkshop);
        }
        if (Pathes.Dir_Game) {
            ReadDir(path.join(Pathes.Dir_Game, "Data"));
            ReadDir(path.join(Pathes.Dir_Game, "Mods"));
        }


        return {
            success: true as const,
            data: data,
        };
    }


}

export default ModListActions;


