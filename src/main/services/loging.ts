import fs from "fs";
import path from "path";
import { app } from "electron";

const logFilePath = path.join(app.getPath("exe"), "logging.log");

function formatMessage(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const l = `[${timestamp}] [${level}] ${message}\n`;
    return l;
}



export const logger = {
    info: (msg: string) => {
        formatMessage("INFO", msg);
        // fs.appendFileSync(logFilePath, formatMessage("INFO", msg));
    },
    warn: (msg: string) => {
        formatMessage("WARN", msg);
        // fs.appendFileSync(logFilePath, formatMessage("WARN", msg));
    },
    error: (msg: string) => {
        formatMessage("ERROR", msg);
        // fs.appendFileSync(logFilePath, formatMessage("ERROR", msg));
    },
    errorUnknown: (error: unknown) => {
        formatMessage("ERROR", (error instanceof Error && error.stack) || String(error));
        // fs.appendFileSync(logFilePath, formatMessage("ERROR", (error instanceof Error && error.stack) || String(error)));
    },
};
