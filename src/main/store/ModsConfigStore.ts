import fs from "fs";
import { Pathes } from "../Pathes";
import { builder, buildXMLWithDeclaration, parser } from "../utils";
import Schemes from "main/Schemes";

namespace ModsConfigStore {
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
        const string = buildXMLWithDeclaration(Schemes.XML.ModsConfig.Write.parse(modsConfig));
        if (!fs.existsSync(Pathes.Dir_Config)) fs.mkdirSync(Pathes.Dir_Config, { recursive: true });
        fs.writeFileSync(Pathes.File_ModsConfigXML, string);
    }
}

export default ModsConfigStore;
