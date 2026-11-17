import fs from "fs/promises";
import path from "path";
import { app } from "electron";
import { injectable } from "tsyringe";
import { TtlCache, isExpired } from "#features/time/shared";

export interface Cache<V> {
    getOrLoad: (key: string, loader: () => Promise<V>) => Promise<V>;
}

interface Entry {
    value: unknown;
    at: number;
}

type CacheData = Record<string, Record<string, Entry>>;
export interface Cache<V> {
    get: (key: string) => Promise<V | undefined>;
    set: (key: string, value: V) => void;
    getOrLoad: (key: string, loader: () => Promise<V>) => Promise<V>;
}

const SAVE_DELAY_MS = 500;

@injectable()
export class CacheService {
    private readonly file = path.join(app.getPath("userData"), "cache.json");

    /** Зберігаємо ПРОМІС: паралельні виклики діляться одним читанням і одним об'єктом */
    private loading: Promise<CacheData> | null = null;
    private saveTimer?: NodeJS.Timeout;
    private dirty = false;

    /** Записати незбережені зміни при виході */
    public async dispose() {
        clearTimeout(this.saveTimer);
        if (this.dirty) await this.save();
    }

    /** Іменований кеш: namespace = розділ у файлі, ttl = час життя запису */
    public namespace<V>(name: string, ttl: number): Cache<V> {
        const mem = new TtlCache<string, V>(ttl);

        return {
            // get: (key) => mem.get(key),
            // set: (key, value) => mem.set(key, value),
            get: async (key) => {
                const cached = mem.get(key);
                if (cached !== undefined) return Promise.resolve(cached);

                const data = await this.load();
                const hit = data[name]?.[key];

                if (!hit || isExpired(hit.at, ttl)) {
                    return undefined;
                }

                const value = hit.value as V;
                mem.set(key, value);

                return value;
            },

            set: async (key, value) => {
                mem.set(key, value);

                const data = await this.load();
                const section = (data[name] ??= {});

                section[key] = {
                    value,
                    at: Date.now(),
                };

                this.scheduleSave();
            },

            getOrLoad: (key, loader) =>
                mem.getOrLoad(key, async () => {
                    const data = await this.load();
                    const section = (data[name] ??= {});

                    const hit = section[key];
                    if (hit && !isExpired(hit.at, ttl)) return hit.value as V;

                    const value = await loader();
                    section[key] = { value, at: Date.now() };
                    this.scheduleSave();
                    return value;
                }),
        };
    }

    // ---------- внутрішнє ----------

    private load(): Promise<CacheData> {
        return this.loading ??= fs.readFile(this.file, "utf8")
            .then((text): CacheData => {
                const parsed: unknown = JSON.parse(text);
                return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                    ? (parsed as CacheData)
                    : {};
            })
            .catch((): CacheData => ({}));      // файлу немає або він зіпсований
    }

    /** Один запис на пачку змін, а не на кожен ключ */
    private scheduleSave() {
        this.dirty = true;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.save().catch((err) => console.error("cache save failed", err));
        }, SAVE_DELAY_MS);
    }

    private async save() {
        const data = await this.load();
        this.dirty = false;
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        await fs.writeFile(this.file, JSON.stringify(data));
    }
}
