import { isExpired } from "./ttl";

interface Entry<V> { value: V; at: number }

export class TtlCache<K, V> {
    private entries = new Map<K, Entry<V>>();
    private pending = new Map<K, Promise<V>>();

    public constructor(private ttl: number) { }

    /** Значення, якщо воно свіже, інакше undefined */
    public get(key: K): V | undefined {
        const e = this.entries.get(key);
        if (!e) return undefined;
        if (isExpired(e.at, this.ttl)) {
            this.entries.delete(key);
            return undefined;
        }
        return e.value;
    }

    public set(key: K, value: V) {
        this.entries.set(key, { value, at: Date.now() });
    }

    /** Свіже з кешу або завантажити. Паралельні виклики з одним key діляться одним loader */
    public getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
        const cached = this.get(key);
        if (cached !== undefined) return Promise.resolve(cached);

        const running = this.pending.get(key);
        if (running) return running;

        const task = loader()
            .then((value) => { this.set(key, value); return value; })   // помилки не кешуються
            .finally(() => this.pending.delete(key));

        this.pending.set(key, task);
        return task;
    }

    public invalidate(key: K) { this.entries.delete(key); }
    public clear() { this.entries.clear(); }
}