import React, { JSX } from "react";
import { openModInSteam, openUrl } from "../utils";
import { ModType } from "enums";
import { GameInfoStore, ModsConfigStore } from "@Stores";
import { Store } from "@Stores/store";
import { GitSpace } from "@Renderer/scripts/Classes/git";
import Tag from "./Tag";
import Storabled from "./Storabled";
import { __ModListStores__ } from "../Modules/ModListManager/__ModListStore__";

import RimWorldIcon from "@Renderer/scripts/Components/Icons/RimWorldIcon";
import SteamIcon from "@Renderer/scripts/Components/Icons/SteamIcon";
import FolderIcon from "@mui/icons-material/Folder";
import GithubIcon from "@mui/icons-material/GitHub";
import { SvgIconProps } from "@mui/joy";
import { SvgIconOwnProps } from "@mui/material";

export type Mod_ALL = Mod_DLC | Mod_Steam | Mod_Local | Mod_Git;
export abstract class Mod extends Storabled implements ModReadingInfo_BASE {
    public static create(data: ModReadingInfo_ALL): Mod_ALL {
        if (data.type === ModType.DLC) return new Mod_DLC(data);
        else if (data.type === ModType.Steam) return new Mod_Steam(data);
        else if (data.type === ModType.Local) return new Mod_Local(data);
        else if (data.type === ModType.Git) return new Mod_Git(data);
        else throw Error("Unknown Type");
    }

    public static pickTags(modPackageId: PackageId, tags: ModTagJSON[]) {
        return tags.filter(tag => tag.packageIds.find(pid => Mod.samePackageId(modPackageId, pid))) ?? [];
    }

    public type: ModReadingInfo_BASE["type"];
    public about: ModReadingInfo_BASE["about"];
    public dirPath: ModReadingInfo_BASE["dirPath"];
    public previewPath: ModReadingInfo_BASE["previewPath"];
    /**@deprecated */
    public warnings: ModReadingInfo_BASE["warnings"];

    public tags: Tag[] = [];

    public override store = new Store<Mod>({ value: this })

    public constructor(data: ModReadingInfo_BASE) {
        super();
        this.about = data.about;
        this.type = data.type;
        this.dirPath = data.dirPath;
        this.previewPath = data.previewPath;
        this.warnings = data.warnings;
    }

    /**@deprecated */
    public useEnablingSub() {
        ModsConfigStore.use(mc => mc.activeMods.some(pid => this.samePackageId(pid)))
    }

    public getIcon(props?: SvgIconOwnProps): JSX.Element {
        switch (this.type) {
            case ModType.Steam: return React.createElement(SteamIcon, props);
            case ModType.Local: return React.createElement(FolderIcon, props);
            case ModType.DLC: return React.createElement(RimWorldIcon, props);
            case ModType.Git: return React.createElement(GithubIcon, props);
        }
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
    public getPositionAtList() {
        const pos = __ModListStores__.actives.get().indexOf(this as Mod_ALL);
        return pos >= 0 ? pos : null;
    }
    /**Position at `modsConfig`
     * @returns `number` - from `0` 
     * @returns `null` - mod disabled
     */
    public getPos_File() {
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
    public openSource() {
        if (this.about.url) openUrl(this.about.url);
    }
    public hasSourceUrl() {
        return !!this.about.url;
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
        const actives = __ModListStores__.actives.get();
        const unactives = __ModListStores__.unactives.get();


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
        const actives = __ModListStores__.actives.get();

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


    public * getLoadAfterErrors() {
        const pos = this.getPositionAtList();
        if (!pos) return;
        const actives = __ModListStores__.actives.get();
        // const actives = ModsConfigStore.get().activeMods;


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
        const pos = this.getPositionAtList();
        if (!pos) return;
        const actives = __ModListStores__.actives.get();

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


export class Mod_DLC extends Mod implements ModReadingInfo_DLC {
    declare type: ModType.DLC;
}

export class Mod_Steam extends Mod implements ModReadingInfo_Steam {
    declare type: ModType.Steam;
    public steamId: ModReadingInfo_Steam["steamId"];

    public constructor(data: ModReadingInfo_Steam) {
        super(data);
        this.steamId = data.steamId;
    }


    public openInSteam() {
        if (this.steamId) openModInSteam(this.steamId);
    }
    public unsubscribe() {
        if (this.steamId) $invoke.unsubscribeFromSteamMod(this.steamId);
    }
}

export class Mod_Local extends Mod implements ModReadingInfo_Local {
    declare type: ModType.Local;

    public delete() {
        $invoke.deleteMod(this.dirPath);
    }
}

export class Mod_Git extends Mod implements ModReadingInfo_Git {
    declare type: ModType.Git;
    public gitinfo: ModReadingInfo_Git["gitinfo"];
    public gitrepo: null | GitSpace.GitRepo;

    public constructor(data: ModReadingInfo_Git) {
        super(data);
        this.gitinfo = data.gitinfo;

        if (this.gitinfo.success) this.gitrepo = GitSpace.getByUrl(this.gitinfo.data.info.repoUrl) ?? null;
        else this.gitrepo = null;
    }


    public openInGit() {
        if (this.gitinfo.success) openUrl(this.gitinfo.data.info.repoUrl);
    }
    public async canBeUpdateGit(): Promise<boolean> {
        if (!this.gitinfo.success || !this.gitrepo) return false;
        return (await this.gitrepo.checkUpdate(this.gitinfo.data)).canBeUpdate;
    }
}

export enum ModErrorType { None = 0, Warn = 1, Error = 2 }








type DefaultErrors = {
    isWrongVersion: ReturnType<ModErrorReport["isWrongVersion"]>,
    isMissingModVersion: ReturnType<ModErrorReport["isMissingModVersion"]>,
}
type ActiveErrors = {
    missingDependencies: (Mod_ALL | ModDependency)[],
    incompatible: Mod_ALL[],
    loadAfterErrors: Mod_ALL[],
    loadBeforeErrors: Mod_ALL[],
}
class ModErrorReport {
    public status: ModErrorType = ModErrorType.None;
    public activeErrors = false;
    public defaultErrors = false;

    public errors: Partial<DefaultErrors & ActiveErrors> = {};

    public constructor(public mod: Mod) {
        this.updateDefaultErrors();
    }
    public update() {
        this.updateActiveErrors();
        this.updateDefaultErrors();
        this.updateStatus();
    }

    private updateActiveErrors() {
        const data: ActiveErrors = {
            missingDependencies: [...this.getMissingDependencies()],
            incompatible: [...this.getIncompatible()],
            loadAfterErrors: [...this.getLoadAfterErrors()],
            loadBeforeErrors: [...this.getLoadBeforeErrors()],
        }

        this.errors = { ...this.errors, ...data };
        this.activeErrors = Object.values(data).some(a => a.length);
        this.updateStatus();

        return data;
    }
    private updateDefaultErrors() {
        const data: DefaultErrors = {
            isWrongVersion: this.isWrongVersion(),
            isMissingModVersion: this.isMissingModVersion(),
        }
        this.errors = { ...this.errors, ...data };
        this.defaultErrors = Object.values(data).some(a => a);
        this.updateStatus();

        return data;
    }
    public updateStatus() {
        if (this.activeErrors) this.status = ModErrorType.Error;
        else if (this.defaultErrors) this.status = ModErrorType.Warn;
        else this.status = ModErrorType.None;

        return this.status;
    }

    public clearActiveErrors() {
        const keys: (keyof ActiveErrors)[] = ["incompatible", "loadAfterErrors", "loadBeforeErrors", "missingDependencies"];
        for (const key of keys) delete this.errors[key];
    }




    public isWrongVersion() {
        const gameInfo = GameInfoStore.get();
        if (this.mod.about.supportedVersions && gameInfo.gameVersionShort) {
            return !this.mod.about.supportedVersions.includes(gameInfo.gameVersionShort);
        } return false;
    }
    public isMissingModVersion() {
        if (this.mod.type == ModType.DLC) return false;
        return !this.mod.about.supportedVersions;
    }


    public * getMissingDependencies(): Iterable<Mod_ALL | ModDependency> {
        if (!this.mod.isActive()) return [];
        const actives = __ModListStores__.actives.get();
        const unactives = __ModListStores__.unactives.get();


        deps:
        for (const dep of this.mod.about.modDependencies ?? []) {
            for (const mod of actives)
                if (mod.samePackageId(dep.packageId))
                    continue deps;

            for (const mod of unactives)
                if (mod.samePackageId(dep.packageId))
                    return yield mod;

            yield dep;
        }
    }
    public * getIncompatible(): Iterable<Mod_ALL> {
        if (!this.mod.isActive()) return;
        const actives = __ModListStores__.actives.get();

        for (const pid of this.mod.about.incompatibleWith ?? []) {
            for (const mod of actives) {
                if (mod.samePackageId(pid)) {
                    yield mod;
                }
            }
        }
    }
    public * getLoadAfterErrors(): Iterable<Mod_ALL> {
        const pos = this.mod.getPositionAtList();
        if (!pos) return;
        const actives = __ModListStores__.actives.get();


        for (const pid of this.mod.about.loadAfter ?? []) {
            for (let i = pos + 1; i < actives.length; i++) {
                const mod = actives[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
    public * getLoadBeforeErrors(): Iterable<Mod_ALL> {
        const pos = this.mod.getPositionAtList();
        if (!pos) return;
        const actives = __ModListStores__.actives.get();

        for (const pid of this.mod.about.loadBefore ?? []) {
            for (let i = 0; i < pos; i++) {
                const mod = actives[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
}