import path from "path";
import fs from "fs";
import { app } from "electron";
import Schemes from "@common/Schemes";
import { Pathes } from "./Pathes";

namespace UserConfig {
    export const getConfigPath = () => Pathes.UserConfig;

    // const noCatchStore = Schemes.Store._def.innerType;

    // export async function GetWithValidate() {
    //     const e = await Validate();
    //     if (e) return { success: false as const, errors: e };
    //     else return { success: true as const, data: Get() };
    // }

    export async function Debug() {
        const result = await Schemes.StoreDebug.safeParseAsync(UserConfig.Get());
        if (result.success) return null;
        return result.error.issues;
    }

    export function Get(): UserConfig;
    export function Get<K extends keyof UserConfig>(key: K): UserConfig[K];
    export function Get<K extends keyof UserConfig>(key?: K) {
        try {
            const configJs = JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));

            if (!key) return Schemes.StoreGet.parse(configJs);

            return Schemes.StoreGet._def.innerType.shape[key].parse(configJs[key]);
        } catch { return Schemes.StoreGet.parse(void 0); }
    }

    export function Set(value: UserConfig): void;
    export function Set<K extends keyof UserConfig>(key: K, value: UserConfig[K]): void;
    export function Set<K extends keyof UserConfig>(...[a1, a2]: [value: UserConfig] | [key: K, value: UserConfig[K]]) {
        const configPath = getConfigPath();
        if (typeof a1 !== "string") {
            fs.writeFileSync(configPath, JSON.stringify(Schemes.StoreSet.parse(a1), null, 4));
        } else {
            let configJs;

            try { configJs = JSON.parse(fs.readFileSync(configPath, "utf8")); }
            catch { configJs = {}; }

            configJs[a1] = Schemes.StoreSet._def.shape()[a1].parse(a2);
            fs.writeFileSync(configPath, JSON.stringify(configJs, null, 4));
        }
    }

    // export function Delete(key) {
    //     const configPath = getConfigPath();
    //     const configJson = fs.readFileSync(configPath, "utf8");
    //     const configJs = JSON.parse(configJson);
    //     configJs[key] = "";
    //     const newConfigJson = JSON.stringify(configJs);
    //     fs.writeFileSync(configPath, newConfigJson);
    // }
}

export default UserConfig;

