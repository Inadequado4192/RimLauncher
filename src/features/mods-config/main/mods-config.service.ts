import chokidar, { type FSWatcher } from "chokidar";
import fs from "fs/promises";
import { injectable } from "tsyringe";
import { buildXMLWithDeclaration, getXmlParser } from "#features/XML/shared";
import { emitAll, handle, Initializable } from "#features/base/main";
import { PublicPathsRegistry } from "#features/public-paths/main";
import { PackageIdLower } from "#features/app/shared";
import {
    ModsConfig, ModsConfigIpc, ModsConfigPatch,
    modsConfigBaseWriteSchema, modsConfigReadSchema,
} from "../shared";
import { PathToConfigDir, PathToModsConfigXMLFile } from "./paths";

const same = (a: ModsConfig, b: ModsConfig) => JSON.stringify(a) === JSON.stringify(b);

function moveMod(c: ModsConfig, id: PackageIdLower, ref: PackageIdLower, offset: 0 | 1): ModsConfig {
    const list = c.activeMods.filter((i) => i !== id);
    const refIndex = list.indexOf(ref);
    if (refIndex === -1) return c;
    list.splice(refIndex + offset, 0, id);
    return { ...c, activeMods: list };
}

@injectable()
export class ModsConfigService implements Initializable {
    private cache: ModsConfig | null = null;
    private loading: Promise<ModsConfig> | null = null;
    private queue: Promise<unknown> = Promise.resolve();
    private watcher?: FSWatcher;

    public constructor(private _publicPathsRegistry: PublicPathsRegistry) { }

    public initialize() {
        handle(ModsConfigIpc.Read, () => this.get());

        handle(ModsConfigIpc.EnableMods, (_, ids) =>
            this.mutate((c) => ({ ...c, activeMods: [...new Set([...c.activeMods, ...ids])] })));

        handle(ModsConfigIpc.DisableMods, (_, ids) => {
            const off = new Set<PackageIdLower>(ids);
            return this.mutate((c) => ({ ...c, activeMods: c.activeMods.filter((i) => !off.has(i)) }));
        });

        handle(ModsConfigIpc.SetMods, (_, ids) =>
            this.mutate((c) => ({ ...c, activeMods: [...new Set(ids)] })));

        handle(ModsConfigIpc.ClearActives, () =>
            this.mutate((c) => ({ ...c, activeMods: [] })));

        handle(ModsConfigIpc.EnableModBefore, (_, id, before) =>
            this.mutate((c) => moveMod(c, id, before, 0)));

        handle(ModsConfigIpc.EnableModAfter, (_, id, after) =>
            this.mutate((c) => moveMod(c, id, after, 1)));


        this.watcher = chokidar
            .watch(PathToModsConfigXMLFile, {
                ignoreInitial: true,
                awaitWriteFinish: { stabilityThreshold: 100 },
            })
            .on("add", () => void this.reloadFromDisk())
            .on("change", () => void this.reloadFromDisk());

        this._publicPathsRegistry.registry({
            label: "mods-config.title",
            path: PathToModsConfigXMLFile,
        });
    }

    public dispose() {
        return this.watcher?.close();
    }


    public get(): Promise<ModsConfig> {
        if (this.cache) return Promise.resolve(this.cache);
        return this.loading ??= this.read()
            .then((c) => (this.cache = c))
            .finally(() => (this.loading = null));
    }

    public patch(p: ModsConfigPatch) {
        return this.update((c) => ({ ...c, ...p }));
    }


    private async mutate(fn: (c: ModsConfig) => ModsConfig): Promise<void> {
        await this.update(fn);
    }

    private update(fn: (c: ModsConfig) => ModsConfig): Promise<ModsConfig> {
        const task = this.queue.then(async () => {
            const current = await this.get();
            const next = fn(current);
            return same(current, next) ? current : this.write(next);
        });
        this.queue = task.catch(() => { });
        return task;
    }

    private async read(): Promise<ModsConfig> {
        let text: string;
        try {
            text = await fs.readFile(PathToModsConfigXMLFile, "utf8");
        } catch (err: any) {
            if (err?.code === "ENOENT") throw new Error(`The file “${PathToModsConfigXMLFile}” could not be found.`);
            throw err;
        }
        const xmlParser = getXmlParser();
        return modsConfigReadSchema.parse(xmlParser.parse(text));
    }

    private async write(config: ModsConfig): Promise<ModsConfig> {
        const safe = modsConfigBaseWriteSchema.parse(config);

        const xml = buildXMLWithDeclaration({
            ModsConfigData: {
                version: safe.version,
                activeMods: { li: safe.activeMods },
                knownExpansions: { li: safe.knownExpansions },
            },
        });

        await fs.mkdir(PathToConfigDir, { recursive: true });
        await fs.writeFile(PathToModsConfigXMLFile, xml);

        this.cache = safe;
        emitAll(ModsConfigIpc.Changed, safe);
        return safe;
    }

    private async reloadFromDisk() {
        try {
            const next = await this.read();
            if (this.cache && same(next, this.cache)) return;
            this.cache = next;
            emitAll(ModsConfigIpc.Changed, next);
        } catch (err) {
            console.error("mods-config reload failed", err);
        }
    }
}