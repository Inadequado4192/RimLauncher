import { XMLParser } from "fast-xml-parser";
import XMLBuilder from "fast-xml-builder";

export function getXmlParser() {
    return new XMLParser({
        isArray: (tagName) => tagName === "li",
    });
}

export function getXmlBuilder() {
    return new XMLBuilder({
        format: true,
    });
}

export function buildXMLWithDeclaration(jObj: any) {
    const xmlBuilder = getXmlBuilder();
    return `<?xml version="1.0" encoding="utf-8"?>\n` + xmlBuilder.build(jObj);
}



export * from "./schemas";