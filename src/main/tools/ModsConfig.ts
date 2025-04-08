import fs from "fs";
import { Pathes } from "../Pathes";
import { builder, parser } from "../utilts";
import Schemes from "src/main/Schemes";

namespace ModsConfig {
    export function get() {
        const data = parser.parse(fs.readFileSync(Pathes.ModsConfigXML).toString()).ModsConfigData;
        const result = Schemes.XML.ModsConfig.parse(data) as ModsConfig_Schema;
        return result;
    }
    export function save(modsConfig: ModsConfig_Schema) {
        const string = `<?xml version="1.0" encoding="utf-8"?>\n` + builder.build({
            ModsConfigData: {
                version: modsConfig.version,
                activeMods: { li: modsConfig.activeMods },
                knownExpansions: { li: modsConfig.knownExpansions },
            }
        }) as string;
        fs.writeFileSync(Pathes.ModsConfigXML, string);
    }
}

export default ModsConfig;
