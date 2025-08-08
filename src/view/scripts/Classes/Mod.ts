import React from "react";
import { openModInSteam, openUrl } from "../utils";
import { ModType } from "enums";
import { GameInfoStore, ModsConfigStore } from "@Stores";
import { ModListStore } from "@Context/ModListContext";
import { Store, StoreVersion } from "@Stores/store";
import { GitSpace } from "@Common/libs/git";


type ModOtherData = {
    tags: ModTag[]
}
export abstract class Mod implements ModReadingInfo_BASE {
    public static create(data: ModReadingInfo_ALL, other: ModOtherData): Mod_ALL {
        if (data.type === ModType.DLC) return new Mod_DLC(data, other);
        else if (data.type === ModType.Steam) return new Mod_Steam(data, other);
        else if (data.type === ModType.Local) return new Mod_Local(data, other);
        else if (data.type === ModType.Git) return new Mod_Git(data, other);
        else throw Error("Unknown Type");
    }

    public static getTags(tags: ModTag[], modPackageId: PackageId) {
        return tags.filter(tag => tag.packageIds.find(pid => Mod.samePackageId(modPackageId, pid))) ?? [];
    }

    public type: ModReadingInfo_BASE["type"];
    public about: ModReadingInfo_BASE["about"];
    public dirPath: ModReadingInfo_BASE["dirPath"];
    public previewPath: ModReadingInfo_BASE["previewPath"];
    public warnings: ModReadingInfo_BASE["warnings"];

    public tags: ModTag[];

    // public elementRef: HTMLLIElement | null = null;

    public constructor(data: ModReadingInfo_BASE, other: ModOtherData) {
        this.about = data.about;
        this.type = data.type;
        this.dirPath = data.dirPath;
        this.previewPath = data.previewPath;
        this.warnings = data.warnings;

        this.tags = other.tags;


        this.store = new StoreVersion({});
    }
    public store: StoreVersion;
    public useEnablingSub() {
        ModsConfigStore.use(mc => mc.activeMods.some(pid => this.samePackageId(pid)))
    }



    public static samePackageId(packageId2: PackageId, packageId1: PackageId) {
        return packageId1.toLowerCase() == packageId2.toLowerCase();
    }

    public samePackageId(packageId: PackageId, ignorePostfix = false) {
        return Mod.samePackageId(this.about.packageId, packageId);
    }


    public isActive(): boolean {
        return ModsConfigStore.get().activeMods.includes(this.about.packageId);
    }

    /**Position at `modsConfig`
     * @returns `number` - from `0` 
     * @returns `null` - mod disabled
     */
    public getPos() {
        const pos = ModsConfigStore.get().activeMods.indexOf(this.about.packageId);
        return pos >= 0 ? pos : null;
    }


    public toggleState() {
        this.isActive() ? this.disable() : this.enable();
    }
    public enable() {
        $invoke.enableMod(this.about.packageId);
    }
    public disable() {
        $invoke.disableMod(this.about.packageId);
    }



    public openDir() {
        $invoke.openPath(this.dirPath);
    }


    //#region Type definition
    public isDLC(): this is Mod_DLC {
        return this.type == ModType.DLC;
    }
    public isSteam(): this is Mod_Steam {
        return this.type == ModType.Steam;
    }
    public isLocal(): this is Mod_Local {
        return this.type == ModType.Local;
    }
    public isGit(): this is Mod_Git {
        return this.type == ModType.Git;
    }
    //#endregion


    //#region Errors
    public getErrorType() {
        if (this.hasMissingDependencies()) return ModErrorType.Error;
        if (this.hasIncompatible()) return ModErrorType.Error;
        if (this.hasLoadAfterErrors()) return ModErrorType.Error;
        if (this.hasLoadBeforeErrors()) return ModErrorType.Error;

        if (this.isWrongVersion()) return ModErrorType.Warn;
        if (this.isMissingModVersion()) return ModErrorType.Warn;

        return ModErrorType.None;
    }
    public isWrongVersion() {
        const gameInfo = GameInfoStore.get();
        if (this.about.supportedVersions && gameInfo.gameVersionShort) {
            return !this.about.supportedVersions.includes(gameInfo.gameVersionShort);
        } return false;
    }
    public isMissingModVersion() {
        if (this.type == ModType.DLC) return false;
        return !this.about.supportedVersions;
    }


    public * getMissingDependencies(): Iterable<DeepReadonly<Mod_ALL> | ModDependency> {
        if (!this.isActive()) return [];
        const actives = ModListStore.actives.get();
        const unactives = ModListStore.unactives.get();


        deps:
        for (const dep of this.about.modDependencies ?? []) {
            for (const mod of actives)
                if (mod.samePackageId(dep.packageId))
                    continue deps;

            for (const mod of unactives) {
                if (mod.samePackageId(dep.packageId)) {
                    return yield mod;
                }
            }
            yield dep;
        }
    }
    public hasMissingDependencies() {
        return !this.getMissingDependencies()[Symbol.iterator]().next().done;
    }


    public * getIncompatible(): Iterable<DeepReadonly<Mod_ALL>> {
        if (!this.isActive()) return;
        const actives = ModListStore.actives.get();

        for (const pid of this.about.incompatibleWith ?? []) {
            for (const mod of actives) {
                if (mod.samePackageId(pid)) {
                    yield mod;
                }
            }
        }
    }
    public hasIncompatible() {
        return !this.getIncompatible()[Symbol.iterator]().next().done;
    }


    public * getLoadAfterErrors(): Iterable<DeepReadonly<Mod_ALL>> {
        const pos = this.getPos();
        if (!pos) return;
        const actives = ModListStore.actives.get();

        for (const pid of this.about.loadAfter ?? []) {
            for (let i = pos + 1; i < actives.length; i++) {
                const mod = actives[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
    public hasLoadAfterErrors() {
        return !this.getLoadAfterErrors()[Symbol.iterator]().next().done;
    }

    public * getLoadBeforeErrors(): Iterable<DeepReadonly<Mod_ALL>> {
        const pos = this.getPos();
        if (!pos) return;
        const actives = ModListStore.actives.get();

        for (const pid of this.about.loadBefore ?? []) {
            for (let i = 0; i < pos; i++) {
                const mod = actives[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
    public hasLoadBeforeErrors() {
        return !this.getLoadBeforeErrors()[Symbol.iterator]().next().done;
    }
    //#endregion

}

export type Mod_ALL = Mod_DLC | Mod_Steam | Mod_Local | Mod_Git;

export class Mod_DLC extends Mod implements ModReadingInfo_DLC {
    declare type: ModType.DLC;


}

export class Mod_Steam extends Mod implements ModReadingInfo_Steam {
    declare type: ModType.Steam;
    public steamId: ModReadingInfo_Steam["steamId"];

    public constructor(data: ModReadingInfo_Steam, other: ModOtherData) {
        super(data, other);
        this.steamId = data.steamId;
    }


    public openInSteam() {
        if (this.steamId) openModInSteam(this.steamId);
    }
}

export class Mod_Local extends Mod implements ModReadingInfo_Local {
    declare type: ModType.Local;
}

export class Mod_Git extends Mod implements ModReadingInfo_Git {
    declare type: ModType.Git;
    public gitinfo: ModReadingInfo_Git["gitinfo"];
    public gitrepo: ModReadingInfo_Git["gitrepo"];

    public constructor(data: ModReadingInfo_Git, other: ModOtherData) {
        super(data, other);
        this.gitinfo = data.gitinfo;

        if (this.gitinfo) this.gitrepo = GitSpace.getByUrl(this.gitinfo.url)?.getRepo(this.gitinfo.url) ?? null;
        else this.gitrepo = null;
    }


    public openInGit() {
        if (this.gitinfo) openUrl(this.gitinfo.url);
    }
}

export enum ModErrorType { None = 0, Warn = 1, Error = 2 }