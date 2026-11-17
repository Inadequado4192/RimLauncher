import fs from "fs/promises";
import path from "path";
import { isExpired } from "./ttl";
import { TtlCache } from "./TtlCache";

export class PersistentTtlCache<V> {
    private mem: TtlCache<string, V>;
    private disk: Record<string, { value: V; at: number }> | null = null;

    constructor(private ttl: number, private file: string) {
        this.mem = new TtlCache(this.ttl);
    }

    private async load() {
        if (this.disk) return this.disk;
        try { this.disk = JSON.parse(await fs.readFile(this.file, "utf8")); }
        catch { this.disk = {}; }
        return this.disk!;
    }

    async getOrLoad(key: string, loader: () => Promise<V>): Promise<V> {
        return this.mem.getOrLoad(key, async () => {
            const disk = await this.load();
            const hit = disk[key];
            if (hit && !isExpired(hit.at, this.ttl)) return hit.value;

            const value = await loader();
            disk[key] = { value, at: Date.now() };
            await fs.mkdir(path.dirname(this.file), { recursive: true });
            await fs.writeFile(this.file, JSON.stringify(disk));
            return value;
        });
    }
}