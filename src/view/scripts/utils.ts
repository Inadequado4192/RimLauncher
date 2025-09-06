import { shell } from "electron";
import { Store } from "./Stores/store";

export function openUrl(url: string) {
    // window.open(url, "_blank");
    shell.openExternal(url);
}


export function openModInSteam(steamId: string) {
    openUrl(`steam://url/CommunityFilePage/${steamId}`);
}
export function openModChangesInSteam(steamId: string) {
    openUrl(`steam://openurl/https://steamcommunity.com/sharedfiles/filedetails/changelog/${steamId}`);
}



export class WatcherSet<D> extends Set<D> {
    public store = new Store({ value: () => this });

    public constructor() {
        super();
    }

    public override add(value: D): this {
        this.store.emit();
        return super.add(value);
    }
    public addRange(rest: D[]): this {
        this.store.emit();
        rest.forEach(this.add.bind(this));
        return this;
    }
    public override clear() {
        this.store.emit();
        return super.clear();
    }
    public override delete(value: D): boolean {
        this.store.emit();
        return super.delete(value);
    }
}
