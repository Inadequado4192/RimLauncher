import fs from "fs/promises";
import path from "path";
import { injectable } from "tsyringe";
import { ModPackIpc, ModPackEntry, modPackReadSchema, ModPack, modPackWriteSchema } from "../shared";
import { isModPack, modPack } from "./consts";
import { shell } from "electron";
import { PathToModPacksDir } from "./paths";
import z, { ZodSafeParseResult } from "zod";
import { handle, Initializable } from "#features/base/main";
import { Result, toSafeFileName } from "#features/base/shared";
import { PathError } from "#features/base/shared";
import { fail } from "#features/base/shared";
import { LocalizedString } from "#features/localization/shared";
import { ok } from "#features/base/shared";
import { ModsConfigService } from "#features/mods-config/main";

@injectable()
export class ModPackService implements Initializable {
    public constructor(
        private _modsConfigService: ModsConfigService
    ) { }

    public async initialize() {
        handle(ModPackIpc.ReadAll, () => this.load());
        handle(ModPackIpc.Add, (_, modpack) => this.add(modpack));
        handle(ModPackIpc.Update, (_, modPackName, modpack) => this.update(modPackName, modpack));
        handle(ModPackIpc.Delete, (_, modPackName) => this.delete(modPackName));
        handle(ModPackIpc.Rename, (_, modPackName, newName) => this.rename(modPackName, newName));
        handle(ModPackIpc.Use, (_, modPack) => this.use(modPack));
        handle(ModPackIpc.OpenFolder, async () => {
            await this._mkdir();
            await shell.openPath(PathToModPacksDir);
        });
    }

    public async safeReadPack(pathToPack: string): Promise<ZodSafeParseResult<ModPack>> {
        return modPackReadSchema.safeParseAsync(JSON.parse((await fs.readFile(pathToPack)).toString()));
    }
    public async readPack(pathToPack: string): Promise<ModPack> {
        return modPackReadSchema.parseAsync(JSON.parse((await fs.readFile(pathToPack)).toString()));
    }

    private _mkdir = () => fs.mkdir(PathToModPacksDir, { recursive: true });

    public async load() {
        await this._mkdir();

        const list: Result<ModPackEntry, PathError>[] = [];

        for (const name of await fs.readdir(PathToModPacksDir)) {
            const pathToPack = path.join(PathToModPacksDir, name);
            const res = await this.safeReadPack(pathToPack);
            if (res.success) {
                list.push({
                    success: true,
                    data: {
                        fileName: path.basename(pathToPack),
                        pack: res.data
                    }
                });
            } else {
                list.push({
                    success: false,
                    error: {
                        path: pathToPack,
                        message: z.prettifyError(res.error)
                    }
                })
            }
        }

        return list;
    }

    public async add(pack: ModPack): Promise<Result<void, LocalizedString>> {
        await this._mkdir();

        const pathToPack = path.join(PathToModPacksDir, modPack(toSafeFileName(pack.name, { fallback: "modpack" })));

        const dataToSave = await modPackWriteSchema.parseAsync(pack);

        try {
            await fs.writeFile(pathToPack, JSON.stringify(dataToSave, null, 4), { encoding: "utf-8", flag: "wx" });
            return ok(void 0);
        } catch (err: any) {
            if (err?.code === "EEXIST") return fail({ key: "common.errors.fileNameTaken" });
            throw err;
        }
    }

    public async update(fileName: string, pack: ModPack): Promise<Result<void, LocalizedString>> {
        await this._mkdir();

        const pathToPack = path.resolve(PathToModPacksDir, fileName);
        if (path.dirname(pathToPack) !== PathToModPacksDir || !isModPack(pathToPack)) throw new Error("Invalid file name");

        const safePack = await modPackWriteSchema.parseAsync(pack);

        await fs.writeFile(pathToPack, JSON.stringify(safePack, null, 4), { encoding: "utf-8" });
        return ok(void 0);
    }

    public async delete(fileName: string) {
        await this._mkdir();

        const pathToPack = path.resolve(PathToModPacksDir, fileName);
        if (path.dirname(pathToPack) !== PathToModPacksDir || !isModPack(pathToPack)) throw new Error("Invalid file name");

        await fs.rm(pathToPack, { force: true });
    }

    public async rename(fileName: string, newName: string) {
        await this._mkdir();

        const pathToPack = path.resolve(PathToModPacksDir, fileName);
        if (path.dirname(pathToPack) !== PathToModPacksDir || !isModPack(pathToPack)) throw new Error("Invalid file name");

        const pack = await this.readPack(pathToPack);
        pack.name = modPackReadSchema.shape.name.parse(newName);

        await fs.writeFile(pathToPack, JSON.stringify(pack, null, 4), { encoding: "utf-8" });
    }
    public async use(modPack: ModPack) {
        this._modsConfigService.patch({
            activeMods: modPack.mods.map(m => m.packageId)
        });
    }
}


// import path from "path";
// import fs from "fs";
// import z from "zod";
// import { formatCamelCase } from "@Common/utils";
// import { Schemes } from "#main/core/schemes";
// import { Paths } from "#main/core/paths";
// import { mkdirIfDontExists } from "#main/infrastructure/fsActions";
// import { ModPack, Schemes } from "#main/core/schemes/index";

// export class ModPacks {

//     private static getPackFullname(packName: string) {
//         return path.join(Paths.Dir_ModPacks, Paths.modPack(packName));
//     }





//     private static modsConfigToWritebleModPack(): MainProcessResult<> {
//         const mc = ModsConfigStore.get();
//         const gi = GameInfoStore.get();

//         if (!mc.success || !gi.success) return mc || gi;

//         return Schemes.ModPack.Write.parse({
//             version: gi.data.gameVersionFull,
//             activeMods: mc.data.activeMods,
//         } satisfies ModPack);
//     }



//     private static modPackToModsConfig(modPack: ModPack) {
//         const mc = ModsConfigStore.get();
//         return builder.build(Schemes.XML.ModsConfig.Write.parse({
//             ...mc,
//             activeMods: modPack.activeMods,
//         } satisfies ModsConfig_Types["WriteIn"]));
//     }

//     public static use(packName: string) {
//         mkdirIfDontExists(Pathes.Dir_ModPacks);

//         const res = this.get(this.getPackFullname(packName));

//         if (res.success)
//             fs.writeFileSync(Pathes.File_ModsConfigXML, this.modPackToModsConfig(res.data), "utf-8");
//         else throw res.error;
//     }

//     public static remove(packName: string) {
//         mkdirIfDontExists(Paths.Dir_ModPacks);
//         fs.rmSync(this.getPackFullname(packName));
//     }

//     public static rename(oldName: string, newName: string) {
//         mkdirIfDontExists(Paths.Dir_ModPacks);
//         fs.renameSync(this.getPackFullname(oldName), this.getPackFullname(newName));
//     }
// }