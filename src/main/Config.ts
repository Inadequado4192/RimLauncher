import fs from "fs";
import Schemes from "src/main/Schemes";
import { Pathes } from "./Pathes";

namespace UserConfig {
    export async function Debug() {
        const result = await Schemes.StoreDebug.safeParseAsync(UserConfig.get());
        if (result.success) return null;
        return result.error.issues;
    }

    export function get(): UserConfig;
    export function get<K extends keyof UserConfig>(key: K): UserConfig[K];
    export function get<K extends keyof UserConfig>(key?: K) {
        try {
            const configJs = JSON.parse(fs.readFileSync(Pathes.UserConfig, "utf8"));

            if (!key) return Schemes.StoreGet.parse(configJs);

            return Schemes.StoreGet._def.innerType.shape[key].parse(configJs[key]);
        } catch { return Schemes.StoreGet.parse(void 0); }
    }

    export function set(value: UserConfig): void;
    export function set<K extends keyof UserConfig>(key: K, value: UserConfig[K]): void;
    export function set<K extends keyof UserConfig>(...[a1, a2]: [value: UserConfig] | [key: K, value: UserConfig[K]]) {
        const configPath = Pathes.UserConfig;
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

