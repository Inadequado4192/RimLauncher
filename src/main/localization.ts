import { app } from "electron";
import path from "path";
import fs from "fs";
import Schemes from "@common/Schemes";
import EnglishLocal from "@localization/English.json";
import UserConfig from "./Config";



const localizationPath = app.isPackaged
    ? path.join(process.resourcesPath, "localization")
    : path.resolve("./src/localization");

console.log("Pathes", process.resourcesPath, __dirname, path.resolve("./"));

if (!app.isPackaged) for (let fname of fs.readdirSync(localizationPath)) loadLocal(fname);

function loadLocal(fname: string) {
    let fileName = `${path.basename(fname, ".json")}.json`;
    if (!fs.existsSync(path.join(localizationPath, fname))) fname = "English.json";

    return Schemes.Localization.parse(JSON.parse(fs.readFileSync(path.join(localizationPath, fileName)).toString())) as SomeLocal;
}

namespace Local {
    export const getAccessLanguages = () =>
        fs.readdirSync(localizationPath)
            .filter(fname => fs.lstatSync(path.join(localizationPath, fname)).isFile() && fname.endsWith(".json"))
            .map(fname => loadLocal(fname))

    export const getTargetLocal = () => loadLocal(UserConfig.Get("language"));
    // export function get(key: keyof typeof EnglishLocal["keys"]) {
    //     return targetLocal.keys[key] ?? EnglishLocal.keys[key];
    // }
}
export default Local;



declare global {
    type SomeLocal = typeof EnglishLocal;
}