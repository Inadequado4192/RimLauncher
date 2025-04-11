import fs from "fs"
import path from "path";
import { parser } from "../utilts";
import Schemes from "../Schemes";
import { Pathes } from "../Pathes";
import Localize from "@Common/Localize";


namespace ModList {
    export function getModFrom(type: ModInfo["type"], dirPath: string) {
        const warnings: Warning[] = []
        const aboutDirPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(dirPath, "About"),
            path.join(dirPath, "about"),
        ]);




        if (!aboutDirPath) {
            warnings.push({
                dirPath,
                message: Localize("fileNotFound", [path.join(dirPath, "About")])
            });
            return { warnings };
        }
        const aboutXmlPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "About.xml"),
            path.join(aboutDirPath, "about.xml"),
        ]);

        if (!aboutXmlPath) {
            warnings.push({
                dirPath,
                message: Localize("fileNotFound", [path.join(dirPath, "About/About.xml")])
            });
            return { warnings };
        }
        const xmlText = fs.readFileSync(aboutXmlPath).toString();
        const xml = parser.parse(xmlText);
        const result = Schemes.XML.ModMetaData(dirPath).safeParse(xml.modMetaData ?? xml.ModMetaData);
        if (!result.success) {
            warnings.push({
                dirPath,
                message: result.error.formErrors.formErrors.join("\n"),
            });
            return { warnings };
        }
        const about = result.data;


        const previewPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "Preview.png"),
            path.join(aboutDirPath, "preview.png"),
        ]);


        let steamId: string | undefined;
        if (type == "Steam") {
            steamId =
                (p => fs.existsSync(p) ? fs.readFileSync(p).toString().trim() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt")) ??
                path.basename(dirPath).match(/^(\d+)$/)?.[0];

            if (!steamId) {
                warnings.push({
                    dirPath,
                    message: Localize("missingSteamId")
                });
            }
        }

        return { type, dirPath, previewPath, about, steamId, warnings };
    }
    export function getModList() {
        const list: ReturnType<typeof getModFrom>[] = [];

        function Read(type: ModInfo["type"], folderPath: string) {
            if (!fs.existsSync(folderPath)) return;
            for (const folderName of fs.readdirSync(folderPath)) {
                const fPath = path.join(folderPath, folderName);
                if (!fs.lstatSync(fPath).isDirectory()) continue;
                const result = getModFrom(type, fPath);
                list.push(result);
            }
        }


        if (Pathes.GameWorkshopFolder) Read("Steam", Pathes.GameWorkshopFolder);
        if (Pathes.Game) {
            Read("DLC", path.join(Pathes.Game, "Data"));
            Read("Local", path.join(Pathes.Game, "Mods"));
        } else {
            // return {
            //     success: false as const,
            //     message: Localize("error_gamePathIsUndefined"),
            // }
        }

        return {
            success: true as const,
            data: list,
        };
    }


}

export default ModList;


