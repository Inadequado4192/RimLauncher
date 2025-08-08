import fs from "fs";
import Schemes from "main/Schemes";
import { Pathes } from "../Pathes";

namespace UserConfigStore {
    function createDefault(data?: ModsConfig) {
        const parsedData = Schemes.UserStore.Read.parse(data);
        fs.writeFileSync(Pathes.File_UserConfig, JSON.stringify(parsedData, null, 4));
    }


    export async function DebugPathes() {
        const result = await Schemes.UserStore.DebugPathes.safeParseAsync(UserConfigStore.get());
        if (result.success) return null;
        return result.error.issues;
    }

    export function get(): UserConfig;
    export function get<K extends keyof UserConfig>(key: K): UserConfig[K];
    export function get<K extends keyof UserConfig>(key?: K) {
        let parsedData: any = {};

        try {
            if (fs.existsSync(Pathes.File_UserConfig)) {
                parsedData = JSON.parse(fs.readFileSync(Pathes.File_UserConfig, "utf8"));
            } else {
                createDefault();
            }
        }
        catch { }

        if (!key) return Schemes.UserStore.Read.parse(parsedData);
        return Schemes.UserStore.Read.def.out.def.shape[key].parse(parsedData[key]);
    }

    export function set<K extends keyof UserConfig>(key: K, value: UserConfig[K]) {
        const parsedData = get();
        parsedData[key] = Schemes.UserStore.Write.def.shape[key].parse(value) as any;
        fs.writeFileSync(Pathes.File_UserConfig, JSON.stringify(parsedData, null, 4));
    }
    // export function set(value: UserConfig): void;
    // export function set<K extends keyof UserConfig>(key: K, value: UserConfig[K]): void;
    // export function set<K extends keyof UserConfig>(...[a1, a2]: [value: UserConfig] | [key: K, value: UserConfig[K]]) {
    //     const configPath = Pathes.File_UserConfig;
    //     if (typeof a1 !== "string") {
    //         fs.writeFileSync(configPath, JSON.stringify(Schemes.UserStore.Write.parse(a1), null, 4));
    //     } else {
    //         let configJs;

    //         try { configJs = JSON.parse(fs.readFileSync(configPath, "utf8")); }
    //         catch { configJs = {}; }

    //         configJs[a1] = Schemes.UserStore.Write.def.shape[a1].parse(a2);
    //         fs.writeFileSync(configPath, JSON.stringify(configJs, null, 4));
    //     }
    // }
}

export default UserConfigStore;

