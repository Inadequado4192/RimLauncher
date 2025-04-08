import path from "path";
import fs from "fs";
import { Pathes } from "../Pathes";
import { mkdirIfDontExists, parser } from "../utilts";
import { formatCamelCase } from "@Common/utils";
import Schemes from "src/main/Schemes";

namespace ModPacks {
    export const modPackExt = ".modpack";
    export function get(pathToConfigs = Pathes.ModsConfigXML) {
        const data = parser.parse(fs.readFileSync(pathToConfigs).toString()).ModsConfigData;
        return Schemes.XML.ModsConfig.parse(data);
    }

    export function save(packName: string) {
        fs.copyFileSync(Pathes.ModsConfigXML, path.join(Pathes.ModPacks, `${packName}${modPackExt}`));
    }

    export function use(packName: string) {
        fs.writeFileSync(Pathes.ModsConfigXML, fs.readFileSync(path.join(Pathes.ModPacks, `${packName}${modPackExt}`)).toString());
    }

    export function remove(packName: string) {
        fs.rmSync(path.join(Pathes.ModPacks, `${packName}${modPackExt}`));
    }

    export function rename(oldname: string, newname: string) {
        fs.renameSync(path.join(Pathes.ModPacks, `${oldname}${modPackExt}`), path.join(Pathes.ModPacks, `${newname}${modPackExt}`));
    }

    export function load() {
        const list: ModPackInfo[] = [];

        mkdirIfDontExists(Pathes.ModPacks);

        for (let name of fs.readdirSync(Pathes.ModPacks)) {
            const pathToPack = path.join(Pathes.ModPacks, name);
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