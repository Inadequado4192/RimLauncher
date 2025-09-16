import fs from "fs"
import path from "path";
import { parser, zodSafeParseResultToAppResult } from "../utils";
import Schemes from "../Schemes";
import { Pathes, PathesMaker } from "../Pathes";
import Localize from "@Common/Localize";
import { ModType } from "enums";
import { z } from "zod";


namespace ModList {
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
                    message: Localize("errors.notFound", ["./About"])
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
                    message: Localize("errors.notFound", ["About/About.xml"])
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

        const iconPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "ModIcon.png"),
        ]);


        const warnings: ModReadingProblem[] = []
        const dirName = path.dirname(dirPath);
        const parentDir = path.basename(dirName);

        const gitInfoFilePath = path.join(dirPath, PathesMaker.gitinfo);

        let data: ModReadingInfo_ALL;

        function createMod<const T extends ModType>(data: Omit<
            Extract<ModReadingInfo_ALL, { type: T }>,
            "dirPath" | "previewPath" | "iconPath" | "about" | "warnings"
        >) { return { ...data, dirPath, previewPath, iconPath, about, warnings }; }

        if (parentDir === "Data") {
            data = createMod<ModType.DLC>({ type: ModType.DLC });
        } else if (parentDir === "294100") {
            const steamId: string | null =
                (p => fs.existsSync(p) ? fs.readFileSync(p).toString().trim() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt")) ??
                path.basename(dirPath).match(/^(\d+)$/)?.[0] ?? null;

            if (!steamId) {
                warnings.push({
                    dirPath,
                    message: Localize("errors.missingSteamId")
                });
            }
            data = createMod<ModType.Steam>({ type: ModType.Steam, steamId });
        } else if (fs.existsSync(gitInfoFilePath)) {
            let gitinfo: ModReadingInfo_Git["gitinfo"] = zodSafeParseResultToAppResult(
                Schemes.GitInfo.Read.safeParse(fs.readFileSync(gitInfoFilePath).toString()),
                dirPath
            );

            data = createMod<ModType.Git>({ type: ModType.Git, gitinfo });
        } else if (parentDir === "Mods") {
            data = createMod<ModType.Local>({ type: ModType.Local });
        } else throw Error("Wrong Path");


        return { success: true, data }
    }

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

        // Finding dublicates
        const ids = new Set<PackageId>();
        [...data.list].forEach((m, i) => {
            if (ids.has(m.about.packageId)) {
                data.errors.push({
                    dirPath: m.dirPath,
                    message: `Dublicate: ${m.about.name}`,
                    modinfo: m
                });
                data.list.splice(i, 1);
            } else {
                ids.add(m.about.packageId);
            }
        })

        return {
            success: true as const,
            data: data,
        };
    }


}

export default ModList;


