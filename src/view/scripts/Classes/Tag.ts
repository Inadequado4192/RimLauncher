import { Store, StoreCompares, StoreCompareType } from "../Stores/store";
import type { Mod } from "./Mod";
import { WatcherSet } from "../utils";
import Storabled from "./Storabled";

export default class Tag extends Storabled implements ModTagJSON {
    public name!: string;
    public color!: string;
    public packageIds!: PackageId[];

    public override store = new Store<Tag>({ value: this })
    public constructor(data: ModTagJSON) {
        super();
        this.update(data);
    }

    public update(data: ModTagJSON) {
        this.name = data.name;
        this.color = data.color;
        this.packageIds = data.packageIds;
    }

    public toJSON(): ModTagJSON {
        return {
            name: this.name,
            color: this.color,
            packageIds: this.packageIds
        }
    }

    public static Compare(prev: ModTagJSON[], next: ModTagJSON[]): boolean {
        if (prev.length !== next.length) return false;

        for (let i = 0; i < prev.length; i++) {
            let p = prev[i]!, n = next[i]!;
            if (p.name !== n.name) return false;
            if (p.color !== n.color) return false;
            if (!StoreCompares.primitiveArraysEqual(p.packageIds, n.packageIds)) return false;
        }

        return true;
    }

    public static storeComparePattern(...data: ("name" | "color")[]) {
        return (p: Tag[], n: Tag[]) => StoreCompares.isEqualAtArray(p, n, (p, n) => {
            if (data.includes("name") && p.name !== n.name) return false;
            if (data.includes("color") && p.color !== n.color) return false;
            return true;
        })
    }
}


export class TagCollection extends WatcherSet<Tag> {
    public useCompareBy(data: {
        name?: boolean,
        color?: boolean,
        // mods?: boolean
    }) {
        return this.store.use(t => [...t].map(t => {
            let compareString: string[] = [];

            if (data.name) compareString.push(t.name);
            if (data.color) compareString.push(t.color);
            // if (data.) compareString.push([...t.mods].map(m => m.about.packageId).join(","));

            return compareString.join("|");
        }), StoreCompareType.Primitive)
    }
}


// export function _WatcherSet<D>() {
//     const store = new StoreVersion({});
//     const ks = ["add", "clear", "delete"] as const

//     return new Proxy(new Set<D>(), {
//         get(set, key, r) {
//             let val = set[key as keyof typeof set];
//             if (typedInclude(ks, key) && val instanceof Function) {
//                 return (...args: any[]) => {
//                     store.emit();
//                     return (val as any)(...args);
//                 }
//             }
//             return val
//         }
//     })
// }
