import { XMLBuilder, XMLParser } from "fast-xml-parser";
import fs from "fs";



export const parser = new XMLParser({
    isArray: (tagName) => tagName == "li"
});
export const builder = new XMLBuilder({
    format: true
});



export function mkdirIfDontExists(path: string) {
    if (!fs.existsSync(path)) fs.mkdirSync(path);
}


