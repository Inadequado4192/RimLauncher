import path from "path";
import fs from "fs";
import { Pathes } from "../Pathes";
import { formatCamelCase } from "@Common/utils";
import Schemes from "main/Schemes";
import { mkdirIfDontExists } from "./fsActions";
import ModsConfigStore from "@Main/store/ModsConfigStore";
import GameInfoStore from "@Main/store/GameInfoStore";
import { builder } from "@Main/utils";
import z from "zod";

namespace ModPacks {
    export const modPackExt = ".rl-modpack.json";
    export function get(pathToPack: string): z.ZodSafeParseResult<ModPack> {
        return Schemes.ModPack.Read.safeParse(fs.readFileSync(pathToPack).toString());
    }


    function modsConfigToWritebleModPack() {
        const mc = ModsConfigStore.get();
        const gi = GameInfoStore.get();

        if (!gi.success) return null;

        return Schemes.ModPack.Write.parse({
            version: gi.data.gameVersionFull,
            activeMods: mc.activeMods,
        } satisfies ModPack);
    }


    export function save(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);

        const pathToPack = path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`);
        const pack = modsConfigToWritebleModPack();
        if (pack) fs.writeFileSync(pathToPack, JSON.stringify(pack, null, 4), "utf-8");


    }

    function modPackToModsConfig(modPack: ModPack) {
        const mc = ModsConfigStore.get();
        return builder.build(Schemes.XML.ModsConfig.Write.parse({
            ...mc,
            activeMods: modPack.activeMods,
        } satisfies ModsConfig_Types["WriteIn"]));
    }

    export function use(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);

        const pathToPack = path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`);

        const res = get(pathToPack);

        if (res.success)
            fs.writeFileSync(Pathes.File_ModsConfigXML, modPackToModsConfig(res.data), "utf-8");
        else throw res.error;
    }

    export function remove(packName: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        fs.rmSync(path.join(Pathes.Dir_ModPacks, `${packName}${modPackExt}`));
    }

    export function rename(oldname: string, newname: string) {
        mkdirIfDontExists(Pathes.Dir_ModPacks);
        fs.renameSync(path.join(Pathes.Dir_ModPacks, `${oldname}${modPackExt}`), path.join(Pathes.Dir_ModPacks, `${newname}${modPackExt}`));
    }

    export function load() {
        mkdirIfDontExists(Pathes.Dir_ModPacks);

        const list: Result<ModPackInfo, ProblemByPath>[] = [];

        for (let name of fs.readdirSync(Pathes.Dir_ModPacks)) {
            const pathToPack = path.join(Pathes.Dir_ModPacks, name);
            const res = ModPacks.get(pathToPack);
            if (res.success) {
                const { data } = res;
                list.push({
                    success: true,
                    data: {
                        dirPath: pathToPack,
                        name: path.basename(name, modPackExt),
                        version: data.version,
                        modCount: data.activeMods.length,
                        DLC: data.activeMods.filter(a => a.startsWith("ludeon.rimworld.")).map(a => formatCamelCase(a.replace("ludeon.rimworld.", "")))
                    }
                });
            } else {
                list.push({
                    success: false,
                    error: {
                        dirPath: pathToPack,
                        message: z.prettifyError(res.error)
                    }
                })
            }
        }

        return list;
    }
}

export default ModPacks;