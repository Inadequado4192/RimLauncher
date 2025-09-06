import { XMLBuilder, XMLParser } from "fast-xml-parser";
import z from "zod";

export const parser = new XMLParser({
    isArray: (tagName) => tagName == "li"
});
export const builder = new XMLBuilder({
    format: true,
});

export function buildXMLWithDeclaration(jObj: any) {
    return `<?xml version="1.0" encoding="utf-8"?>\n` + builder.build(jObj);
}


export function zodSafeParseResultToAppResult<R>(res: z.ZodSafeParseResult<R>, dirPath: string): Result<R> {
    if (res.success) {
        return {
            success: true,
            data: res.data
        };
    } else {
        return {
            success: false,
            error: {
                dirPath,
                message: z.prettifyError(res.error)
            }
        };
    }
}