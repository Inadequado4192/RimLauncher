import React from "react";
import { UserConfigContextType } from "@Context/UserConfigContext";
import { GameInfoContext } from "@Context/GameInfoContext";
import { ModsConfigContext } from "@Context/ModsConfig";
import { openModInSteam, openUrl } from "../utils";

export class Mod implements ModMetaData_Schema {
    public static modsConfig: ModsConfig_Schema | undefined;
    public static gameInfo: GameInfoData | undefined;

    // public parentModList: ModList | null = null;

    // public static useCreator() {
    //     const { gameInfo } = React.useContext(GameInfoContext);
    //     const modsConfig = React.useContext(ModsConfigContext);

    //     return React.useMemo(() => {
    //         if (!gameInfo || !modsConfig) return null;

    //         return (data: ModInfo | Mod) => new Mod(data, { gameInfo, modsConfig })
    //     }, [gameInfo, modsConfig]);
    // }

    public modListRef?: {
        actives: Mod[],
        unactives: Mod[],
    };

    public name: ModMetaData_Schema["name"];
    public packageId: ModMetaData_Schema["packageId"];
    public author: ModMetaData_Schema["author"];
    public url: ModMetaData_Schema["url"];
    public modVersion: ModMetaData_Schema["modVersion"];
    public description: ModMetaData_Schema["description"];
    public supportedVersions: ModMetaData_Schema["supportedVersions"];
    public modDependencies: NonNullable<ModMetaData_Schema["modDependencies"]>;
    public loadBefore: NonNullable<ModMetaData_Schema["loadBefore"]>;
    public loadAfter: NonNullable<ModMetaData_Schema["loadAfter"]>;
    public forceLoadBefore: NonNullable<ModMetaData_Schema["forceLoadBefore"]>;
    public forceLoadAfter: NonNullable<ModMetaData_Schema["forceLoadAfter"]>;
    public incompatibleWith: NonNullable<ModMetaData_Schema["incompatibleWith"]>;

    public type: ModInfo["type"];
    public dirPath: ModInfo["dirPath"];
    public previewPath: ModInfo["previewPath"];
    public steamId: ModInfo["steamId"];

    public tags: ModTag[] = [];

    // private prevLastModified = -1;
    // private lastModified = -1;

    private _data: ModInfo;
    public constructor(data: ModInfo | Mod) {
        if (data instanceof Mod) {
            this.tags = data.tags;
            data = data._data;
        }
        this._data = data;

        this.name = data.about.name;
        this.packageId = data.about.packageId;
        this.author = data.about.author;
        this.url = data.about.url;
        this.modVersion = data.about.modVersion;
        this.description = data.about.description;
        this.supportedVersions = data.about.supportedVersions;
        this.modDependencies = data.about.modDependencies ?? [];
        this.loadBefore = data.about.loadBefore ?? [];
        this.loadAfter = data.about.loadAfter ?? [];
        this.forceLoadBefore = data.about.forceLoadBefore ?? [];
        this.forceLoadAfter = data.about.forceLoadAfter ?? [];
        this.incompatibleWith = data.about.incompatibleWith ?? [];

        this.type = data.type;
        this.dirPath = data.dirPath;
        this.previewPath = data.previewPath;
        this.steamId = data.steamId;
    }

    public samePackageId(packageId: PackageId, ignorePostfix = false) {
        // if (this.packageId == null) {
        //     return false;
        // }
        if (ignorePostfix) {
            return this.packageId == packageId.toLowerCase();
        }
        return this.packageId == packageId.toLowerCase();
    }

    public isActive(): boolean {
        return Mod.modsConfig?.activeMods.includes(this.packageId) ?? false;
    }

    public getPos() {
        return Mod.modsConfig?.activeMods.indexOf(this.packageId) ?? -1;
    }


    public toggleState() {
        this.isActive() ? this.disable() : this.enable();
    }
    public enable() {
        invoke.enableMod(this.packageId);
    }
    public disable() {
        invoke.disableMod(this.packageId);
    }

    // public hasBeenModified() {
    //     this.prevLastModified = this.lastModified;
    //     this.lastModified = Date.now();
    // }
    // public isHasBeenModified() {
    //     if (this.prevLastModified != this.lastModified) {
    //         this.prevLastModified = this.lastModified;
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }



    public openInSteam() {
        if (this.steamId) openModInSteam(this.steamId);
    }

    public openDir() {
        invoke.openPath(this.dirPath)
    }

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
        if (this.supportedVersions && Mod.gameInfo) {
            return !this.supportedVersions.includes(Mod.gameInfo.gameVersionShort);
        } return false;
    }
    public isMissingModVersion() {
        if (this.type == "DLC") return false;
        return !this.supportedVersions;
    }


    public *getMissingDependencies(): Iterable<Mod | ModDependency> {
        if (!this.modListRef || !this.isActive()) return [];
        const { actives, unactives } = this.modListRef;

        deps:
        for (const dep of this.modDependencies) {
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


    public *getIncompatible(): Iterable<Mod> {
        if (!this.modListRef) return;
        const { actives } = this.modListRef;

        for (const pid of this.incompatibleWith) {
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


    public *getLoadAfterErrors(): Iterable<Mod> {
        const pos = this.getPos();
        if (!this.modListRef || pos < 0) return;
        const { actives } = this.modListRef;


        const array = [...actives];

        if (this.name === "Multiplayer") {
            console.log(this.name, pos, actives.map(a => a.name));
        }

        for (const pid of this.loadAfter) {
            for (let i = pos + 1; i < array.length; i++) {
                const mod = array[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
    public hasLoadAfterErrors() {
        return !this.getLoadAfterErrors()[Symbol.iterator]().next().done;
    }

    public *getLoadBeforeErrors(): Iterable<Mod> {
        const pos = this.getPos();
        if (!this.modListRef || pos < 0) return;
        const { actives } = this.modListRef;

        const array = [...actives];

        for (const pid of this.loadBefore) {
            for (let i = 0; i < pos; i++) {
                const mod = array[i];
                if (mod?.samePackageId(pid)) yield mod;
            }
        }
    }
    public hasLoadBeforeErrors() {
        return !this.getLoadBeforeErrors()[Symbol.iterator]().next().done;
    }
    //#endregion
}

export enum ModErrorType { None = 0, Warn = 1, Error = 2 }