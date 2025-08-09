import fs from "fs";
import { Pathes } from "../Pathes";
import { builder, parser } from "../utilts";
import Schemes from "main/Schemes";

namespace ModsConfig {
    function createDefault(data?: ModsConfig) {
        const parsedData = Schemes.XML.ModsConfig.Read.parse(data);
        fs.writeFileSync(Pathes.File_ModsConfigXML, JSON.stringify(parsedData, null, 4));
        return parsedData;
    }



    export function get(): ModsConfig {
        let parsedData: any;

        try {
            if (fs.existsSync(Pathes.Dir_Config)) {
                parsedData = parser.parse(fs.readFileSync(Pathes.File_ModsConfigXML, "utf8"));
            } else {
                parsedData = createDefault();
            }
        } catch { }

        return Schemes.XML.ModsConfig.Read.parse(parsedData);
    }
    export function save(modsConfig: ModsConfig) {
        const string = `<?xml version="1.0" encoding="utf-8"?>\n` + builder.build(Schemes.XML.ModsConfig.Write.parse(modsConfig));
        if (!fs.existsSync(Pathes.Dir_Config)) fs.mkdirSync(Pathes.Dir_Config, { recursive: true });
        fs.writeFileSync(Pathes.File_ModsConfigXML, string);
    }
}

export default ModsConfig;
