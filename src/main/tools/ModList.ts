import fs from "fs"
import path from "path";
import { parser } from "../utilts";
import Schemes from "../Schemes";
import Localize from "@Common/Localize";
import { Pathes } from "../Pathes";


namespace ModList {
    export function getModFrom(type: ModInfo["type"], dirPath: string): ModInfo | null {
        if (!fs.existsSync(dirPath)) return null;

        const aboutDirPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(dirPath, "About"),
            path.join(dirPath, "about"),
        ]);

        if (!aboutDirPath) {
            // warnings.push({
            //     dirPath, message: `${path.join(dirPath, "About")} is not found`
            // });
            return null;
        }

        const aboutXmlPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "About.xml"),
            path.join(aboutDirPath, "about.xml"),
        ]);

        if (!aboutXmlPath) {
            // warnings.push({
            //     dirPath, message: `${path.join(dirPath, "About/About.xml")} is not found`
            // });
            return null;
        }

        const xmlText = fs.readFileSync(aboutXmlPath).toString();
        const xml = parser.parse(xmlText);
        const result = Schemes.XML.ModMetaData(dirPath).safeParse(xml.modMetaData ?? xml.ModMetaData);
        if (!result.success) {
            // warnings.push({
            //     dirPath,
            //     message: result.error.formErrors.formErrors.join("\n"),
            // });
            return null;
        }

        const about = result.data;

        const previewPath = (ps => ps.find(p => fs.existsSync(p)))([
            path.join(aboutDirPath, "Preview.png"),
            path.join(aboutDirPath, "preview.png"),
        ]);
        const steamId = type == "Steam"
            ? (p => fs.existsSync(p) ? fs.readFileSync(p).toString().trim() : undefined)(path.join(aboutDirPath, "PublishedFileId.txt"))
            : undefined;

        return { type, dirPath, previewPath, about, steamId };
    }
    export function getModList() {
        const
            list: ModInfo[] = [];
        // warnings: {
        //     dirPath: string,
        //     message: string,
        //     // xml: any,
        //     // xmlText: string,
        //     // issues: z.ZodFormattedError<any>
        // }[] = [];

        function Read(type: ModInfo["type"], folderPath: string) {
            if (!fs.existsSync(folderPath)) return;
            for (const folderName of fs.readdirSync(folderPath)) {
                const result = getModFrom(type, path.join(folderPath, folderName));
                if (result) list.push(result);
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
            // warnings
        };
    }


}

export default ModList;