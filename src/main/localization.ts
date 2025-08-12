import { app } from "electron";
import path from "path";
import fs from "fs";
import Schemes from "main/Schemes";
import type EnglishLocal from "@Localization/en-US.json";
import UserConfigStore from "./store/UserConfigStore";


namespace Local {
    const localizationPath = app.isPackaged
        ? path.join(__dirname, "localization")//path.join(process.resourcesPath, "localization")
        : path.resolve("./src/resources/localization");


    // DEBUG
    if (!app.isPackaged) for (let fname of fs.readdirSync(localizationPath)) loadLocal(fname);


    function loadLocal(fname: string): SomeLocal {
        try {
            let fileName = `${path.basename(fname, ".json")}.json`;
            return Schemes.Localization.parse(JSON.parse(fs.readFileSync(path.join(localizationPath, fileName)).toString())) as SomeLocal;
        } catch {
            let fileName = `en-US.json`;
            return Schemes.Localization.parse(JSON.parse(fs.readFileSync(path.join(localizationPath, fileName)).toString())) as SomeLocal;
        }
    }
    export const getAllLanguages = () =>
        fs.readdirSync(localizationPath)
            .filter(fname => fs.lstatSync(path.join(localizationPath, fname)).isFile() && fname.endsWith(".json"))
            .map(fname => ({
                name: path.basename(fname, ".json"),
                data: loadLocal(fname)
            }))

    export const getTargetLocal = () => loadLocal(UserConfigStore.get("language"));
}
export default Local;



declare global {
    type SomeLocal = typeof EnglishLocal;
}