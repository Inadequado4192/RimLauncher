import fs from "fs";
import { Pathes } from "../Pathes";
import { builder, parser } from "../utilts";
import Schemes from "main/Schemes";

namespace ModsConfig {
    export function get(): ModsConfig {
        let parsedData: any;

        try { parsedData = parser.parse(fs.readFileSync(Pathes.File_ModsConfigXML).toString()).ModsConfigData; }
        catch { parsedData = {}; }

        return Schemes.XML.ModsConfig.Read.parse(parsedData);
    }
    export function save(modsConfig: ModsConfig) {
        const string = `<?xml version="1.0" encoding="utf-8"?>\n` + builder.build(Schemes.XML.ModsConfig.Write.parse(modsConfig));
        if (!fs.existsSync(Pathes.Dir_Config)) fs.mkdirSync(Pathes.Dir_Config, { recursive: true });
        fs.writeFileSync(Pathes.File_ModsConfigXML, string);
    }
}

export default ModsConfig;
