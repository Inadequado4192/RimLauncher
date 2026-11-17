import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import fs from "fs/promises";
import { emitAll, handle, Initializable, isTempDir } from "#features/base/main";
import { ModFileStructure, ModCoreIpc, OfficialModType, GameFileStructure, LocalModType } from "../shared";
import { getXmlParser } from "#features/XML/shared";
import z from "zod";
import { injectable } from "tsyringe";
import { UserConfigService } from "#features/user-config/main";
import { fail, ok, Result, sleep } from "#features/base/shared";
import { ModTypeRegistry } from "#features/mod-type/main";
import { ModEntry, ModSchema } from "#features/mod-type/shared";
import { existsSync } from "fs";


@injectable()
export class ModManagerService implements Initializable {
    private watcher?: FSWatcher;
    private pending = new Set<string>();


    public constructor(
        private _modTypeRegistry: ModTypeRegistry,
        private _userConfigService: UserConfigService,
    ) { }

    public async initialize() {
        handle(ModCoreIpc.LoadAll, async () => {
            await this.restartWatcher();
            return await this.scanAll();
        });

        handle(ModCoreIpc.StopWatching, async () => {
            await this.watcher?.close();
            this.pending.clear();
        });


        this._modTypeRegistry.register(OfficialModType, {
            priority: 0,
            detect: ({ parentDir }) => parentDir === GameFileStructure.Data ? {} : null,
        });


        this._modTypeRegistry.register(LocalModType, {
            priority: 100,
            detect: ({ parentDir }) => parentDir === GameFileStructure.Mods ? {} : null,
        });

    }

    private async scanAll() {
        const data: {
            list: ModEntry[],
            // errors: LocalizedString[]
        } = { list: [] };

        const paths = await this._userConfigService.getModsPaths();


        for (const pathToMods of Object.values(paths).filter(p => p !== null)) {
            for (const folderName of await fs.readdir(pathToMods)) {
                const fPath = path.join(pathToMods, folderName);
                if (!(await fs.lstat(fPath)).isDirectory() || isTempDir(fPath)) continue;

                const result = await this.getModFrom(fPath);
                if (result.success) data.list.push(result.data);
                // else if (result.error) data.errors.push(result.error);
            }
        }

        return data;
    }

    private async findExistingPath(baseDir: string, ...possibleNames: string[]): Promise<string | undefined> {
        for (const name of possibleNames) {
            const fullPath = path.join(baseDir, name);
            if (existsSync(fullPath)) return fullPath;
            if (existsSync(fullPath.toLowerCase())) return fullPath.toLowerCase();
        }
    }

    private async getModFrom(dirPath: string): Promise<Result<ModEntry, any>> {
        const aboutDirPath = await this.findExistingPath(dirPath, ModFileStructure.AboutFolder);
        if (!aboutDirPath) {
            return fail({
                key: "errors.notFoundIn",
                args: [dirPath, ModFileStructure.AboutFolder],
            });
        }


        const aboutXmlPath = await this.findExistingPath(aboutDirPath, ModFileStructure.AboutFile)
        if (!aboutXmlPath) {
            return fail({
                key: "errors.notFoundIn",
                args: [aboutDirPath, ModFileStructure.AboutFile]
            });
        }


        const previewPath = await this.findExistingPath(aboutDirPath, ModFileStructure.Preview);
        const iconPath = await this.findExistingPath(aboutDirPath, ModFileStructure.Icon);


        const xmlText = (await fs.readFile(aboutXmlPath)).toString();
        const xmlParser = getXmlParser();
        const xml = xmlParser.parse(xmlText);

        const parseResult = ModSchema.safeParse(xml);
        if (!parseResult.success) {
            return fail({
                key: "errors.badAboutXml",
                args: [z.prettifyError(parseResult.error)],
            });
        }
        const about = parseResult.data;



        const parentDir = path.basename(path.dirname(dirPath));

        about.name ||= path.basename(dirPath);

        const detectResult = await this._modTypeRegistry.detect({ parentDir, aboutDirPath, dirPath });
        if (detectResult !== null) {
            return ok({ dirPath, previewPath, iconPath, about, ...detectResult });
        }
        return fail("common.error");
    }



    private async restartWatcher() {
        await this.watcher?.close();
        this.pending.clear();

        const roots = Object.values(await this._userConfigService.getModsPaths())
            .filter((r): r is string => !!r);
        if (!roots.length) return;

        const watcher = this.watcher = chokidar.watch(roots, {
            ignoreInitial: true,
            depth: 0,
            backend: "polling",
            pollingInterval: 1000,
            ignored: (p) => isTempDir(p),
        });



        watcher
            .on("addDir", (dir) => {
                console.log("addDir", { dir });
                if (roots.includes(dir)) return;
                this.onDirAdded(dir);
            })
            .on("unlinkDir", (dir) => {
                console.log("unlinkDir", { dir });
                if (roots.includes(dir)) return;
                this.pending.delete(dir);
                emitAll(ModCoreIpc.OnModRemoved, dir);
            });
    }
    private async onDirAdded(dir: string) {
        this.pending.add(dir);
        for (let attempt = 0; attempt < 20; attempt++) {
            if (!this.pending.has(dir)) return;
            const result = await this.getModFrom(dir);
            if (result.success) {
                this.pending.delete(dir);
                emitAll(ModCoreIpc.OnModAdded, result.data);
                return;
            }
            await sleep(500);
        }
        this.pending.delete(dir);
    }
}
