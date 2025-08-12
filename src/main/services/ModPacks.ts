import path from "path";
import fs from "fs";
import { Pathes } from "../Pathes";
import { parser } from "../utils";
import { formatCamelCase } from "@Common/utils";
import Schemes from "main/Schemes";
import { mkdirIfDontExists } from "./fsActions";

namespace ModPacks {
    export const modPackExt = ".modpack";
    export function get(pathToConfigs: string = Pathes.File_ModsConfigXML) {
        const data = parser.parse(fs.readFileSync(pathToConfigs).toString()).ModsConfigData;
        return Schemes.XML.ModsPack.parse(data);
    }

    export function save(packName: string) {
        fs.copyFileSync(Pathes.File_ModsConfigXML, path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`));
    }

    export function use(packName: string) {
        fs.writeFileSync(Pathes.File_ModsConfigXML, fs.readFileSync(path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`)).toString());
    }

    export function remove(packName: string) {
        fs.rmSync(path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`));
    }

    export function rename(oldname: string, newname: string) {
        fs.renameSync(path.join(Pathes.Dir_ModPacks, `${oldname}${modPackExt}`), path.join(Pathes.Dir_ModPacks, `${newname}${modPackExt}`));
    }

    export function load() {
        const list: ModPackInfo[] = [];

        mkdirIfDontExists(Pathes.Dir_ModPacks);

        for (let name of fs.readdirSync(Pathes.Dir_ModPacks)) {
            const pathToPack = path.join(Pathes.Dir_ModPacks, name);
            const data = ModPacks.get(pathToPack);
            list.push({
                path: pathToPack,
                name: path.basename(name, modPackExt),
                version: data.version,
                modCount: data.activeMods.length,
                DLC: data.activeMods.filter(a => a.startsWith("ludeon.rimworld.")).map(a => formatCamelCase(a.replace("ludeon.rimworld.", "")))
            });
        }

        return list;
    }
}

export default ModPacks;