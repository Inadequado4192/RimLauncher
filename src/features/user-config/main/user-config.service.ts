import chokidar from "chokidar";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { injectable } from "tsyringe";
import { app } from "electron";
import { handle, emitAll, Initializable } from "#features/base/main";
import { SteamGameId } from "#features/app/shared";
import { LocalKey } from "#features/localization/shared";
import { PublicPathsRegistry } from "#features/public-paths/main";
import {
    ConfigField, RawConfig, PathKey, UserConfigIpc,
    SteamPathField, GamePathField
} from "../shared";
import {
    FindGamePath, FindSteamPath, getUserConfigPath,
    validateRimWorldDir, validateSteamDir,
} from "./paths";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

@injectable()
export class UserConfigService implements Initializable {
    private fields = new Map<string, ConfigField<any>>();
    private cache: RawConfig | null = null;
    private loading: Promise<RawConfig> | null = null;
    private queue: Promise<unknown> = Promise.resolve();
    private normalized: Promise<void> | null = null;

    public constructor(private _publicPathsRegistry: PublicPathsRegistry) {
        [SteamPathField, GamePathField].forEach((f) => this.registerField(f));
    }

    // ---------- реєстрація полів ----------

    public registerField(f: ConfigField<any>) {
        if (this.fields.has(f.key)) throw new Error(`Config field "${f.key}" already registered`);
        this.fields.set(f.key, f);
    }

    // ---------- життєвий цикл ----------

    public async initialize() {
        handle(UserConfigIpc.Read, async () => {
            await (this.normalized ??= this.normalize());
            return this.getRaw();
        });

        handle(UserConfigIpc.SetField, async (_, key, value) => {
            const field = this.fields.get(key);
            if (!field) throw new Error(`Unknown config field "${key}"`);
            await this.setField(field, value);
        });

        handle(UserConfigIpc.ValidatePaths, async () => {
            const steamPath = await this.getField(SteamPathField);
            const gamePath = await this.getField(GamePathField);
            
            const errors: Partial<Record<PathKey, LocalKey>> = {};
            const steamError = steamPath ? validateSteamDir(steamPath) : null;
            const gameError = gamePath ? validateRimWorldDir(gamePath) : null;
            if (steamError) errors.steamPath = steamError;
            if (gameError) errors.gamePath = gameError;

            return errors;
        });

        chokidar.watch(getUserConfigPath(), { ignoreInitial: true })
            .on("add", () => void this.reloadFromDisk())
            .on("change", () => void this.reloadFromDisk());

        const paths = await this.getModsPaths();
        this._publicPathsRegistry.registry({ path: getUserConfigPath(), label: "user-config.title" });
        if (paths.local) this._publicPathsRegistry.registry({ path: paths.local, label: "user-config.paths.local-mods" });
        if (paths.official) this._publicPathsRegistry.registry({ path: paths.official, label: "user-config.paths.official-mods" });
        if (paths.workshop) this._publicPathsRegistry.registry({ path: paths.workshop, label: "user-config.paths.workshop-mods" });
    }

    // ---------- читання ----------

    /** Чистий: лише читає файл. null = файлу немає або він зіпсований */
    private async read(): Promise<RawConfig | null> {
        try {
            const parsed = JSON.parse(await fs.readFile(getUserConfigPath(), "utf8"));
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }

    public getRaw(): Promise<RawConfig> {
        if (this.cache) return Promise.resolve(this.cache);
        return this.loading ??= this.loadOrCreate().finally(() => (this.loading = null));
    }

    private async loadOrCreate(): Promise<RawConfig> {
        const existing = await this.read();
        if (existing) return (this.cache = existing);

        const created = await this.createDefault();
        await this.write(created);
        return created;
    }

    /** Зміна файлу ззовні (гра, користувач) */
    private async reloadFromDisk() {
        const next = await this.read();
        if (!next) return;                                   // зіпсований: чекаємо наступної зміни
        if (this.cache && same(next, this.cache)) return;    // власний запис або без змін
        this.cache = next;
        emitAll(UserConfigIpc.Changed, next);
    }

    // ---------- публічне API ----------

    public async getField<T>(f: ConfigField<T>): Promise<T> {
        const r = f.schema.safeParse((await this.getRaw())[f.key]);
        return r.success ? r.data : f.defaultValue;
    }

    public setField<T>(f: ConfigField<T>, value: T): Promise<void> {
        return this.updateField(f, () => value);
    }

    /** Зміна за старим значенням. Читання, зміна й запис відбуваються в одній черзі */
    public updateField<T>(f: ConfigField<T>, fn: (current: T) => T): Promise<void> {
        return this.enqueue(async () => {
            const raw = await this.getRaw();
            const parsed = f.schema.safeParse(raw[f.key]);
            const next = f.schema.parse(fn(parsed.success ? parsed.data : f.defaultValue));
            if (same(raw[f.key], next)) return;

            const updated = { ...raw, [f.key]: next };
            await this.write(updated);
            emitAll(UserConfigIpc.Changed, updated);
        });
    }

    /** Прогнати кожне зареєстроване поле через схему й зберегти результат (defaults, id тощо) */
    public normalize(): Promise<void> {
        return this.enqueue(async () => {
            const raw = await this.getRaw();
            const next: RawConfig = { ...raw };

            for (const f of this.fields.values()) {
                const r = f.schema.safeParse(raw[f.key]);
                next[f.key] = r.success ? r.data : f.defaultValue;
            }

            if (same(raw, next)) return;
            await this.write(next);
            emitAll(UserConfigIpc.Changed, next);
        });
    }

    public async getModsPaths() {
        const steamPath = await this.getField(SteamPathField);
        const gamePath = await this.getField(GamePathField);
        return {
            workshop: getWorkshopPath(steamPath, gamePath),
            local: gamePath ? path.join(gamePath, "Mods") : null,
            official: gamePath ? path.join(gamePath, "Data") : null,
        };
    }

    // ---------- внутрішнє ----------

    private enqueue<T>(fn: () => Promise<T>): Promise<T> {
        const task = this.queue.then(fn);
        this.queue = task.catch(() => { });
        return task;
    }

    private async createDefault(): Promise<RawConfig> {
        const steamPath = await FindSteamPath();
        const gamePath = await FindGamePath(steamPath ?? undefined);
        return {
            [SteamPathField.key]: steamPath ?? null,
            [GamePathField.key]: gamePath ?? null,
            language: app.getSystemLocale().split("-")[0],
        };
    }

    private async write(raw: RawConfig) {
        this.cache = raw;
        await fs.mkdir(path.dirname(getUserConfigPath()), { recursive: true });
        await fs.writeFile(getUserConfigPath(), JSON.stringify(raw, null, 4));
    }
}

function getWorkshopPath(steamPath: string | null, gamePath: string | null): string | null {
    const candidates = [
        gamePath && path.resolve(gamePath, "..", "..", "workshop", "content", SteamGameId),
        steamPath && path.join(steamPath, "steamapps", "workshop", "content", SteamGameId),
    ];
    return candidates.find((p): p is string => !!p && existsSync(p)) ?? null;
}