import { XMLBuilder, XMLParser } from "fast-xml-parser";
import fs from "fs";
import Pathes from "src/main/Pathes";
import path from "path";
import { formatCamelCase } from "@common/utils";

export const modPackExt = ".modpack";

export const wait = (ms: number) => new Promise<void>(t => setTimeout(() => t(), ms));

export const parser = new XMLParser({
    isArray: (tagName) => tagName == "li"
});
export const builder = new XMLBuilder({});



export function getModsConfigAsString(path = Pathes.ModsConfigXML) {
    return fs.readFileSync(path).toString();
}
export function getModsConfig(path = Pathes.ModsConfigXML) {
    return parser.parse(getModsConfigAsString(path)).ModsConfigData as XML_ModsConfig;
}


export function buildModsConfig(modsConfig: XML_ModsConfig) {
    return `<?xml version="1.0" encoding="utf-8"?>` + builder.build({ ModsConfigData: modsConfig }) as string;
}


export function mkdirIfDontExists(path: string) {
    if (!fs.existsSync(path)) fs.mkdirSync(path);
}



export function loadModPacks() {
    const list: ModPackInfo[] = [];

    mkdirIfDontExists(Pathes.ModPacks);

    for (let name of fs.readdirSync(Pathes.ModPacks)) {
        const pathToPack = path.join(Pathes.ModPacks, name);
        const data = getModsConfig(pathToPack);
        list.push({
            path: pathToPack,
            name: path.basename(name, modPackExt),
            version: data.version,
            modCount: data.activeMods.li.length,
            DLC: data.activeMods.li.filter(a => a.startsWith("ludeon.rimworld.")).map(a => formatCamelCase(a.replace("ludeon.rimworld.", "")))
        });
    }

    return list;
}