import { app } from "electron";
import path from "path";
import fs from "fs";
import Schemes from "@common/Schemes";
import EnglishLocal from "@localization/en-US.json";
import UserConfig from "./Config";



const localizationPath = app.isPackaged
    ? path.join(process.resourcesPath, "localization")
    : path.resolve("./src/localization");

if (!app.isPackaged) for (let fname of fs.readdirSync(localizationPath)) loadLocal(fname);

function loadLocal(fname: string): SomeLocal {
    try {
        let fileName = `${path.basename(fname, ".json")}.json`;
        return Schemes.Localization.parse(JSON.parse(fs.readFileSync(path.join(localizationPath, fileName)).toString())) as SomeLocal;
    } catch (error) {
        return EnglishLocal;
    }
}

namespace Local {
    export const getAccessLanguages = () =>
        fs.readdirSync(localizationPath)
            .filter(fname => fs.lstatSync(path.join(localizationPath, fname)).isFile() && fname.endsWith(".json"))
            .map(fname => ({
                name: path.basename(fname, ".json"),
                data: loadLocal(fname)
            }))

    export const getTargetLocal = () => loadLocal(UserConfig.Get("language"));
}
export default Local;



declare global {
    type SomeLocal = typeof EnglishLocal;
}