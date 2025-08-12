import fs from "fs";
import path from "path";
import { app } from "electron";

const logFilePath = path.join(app.getPath("userData"), "logging.log");

function formatMessage(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const l = `[${timestamp}] [${level}] ${message}\n`;
    return l;
}

function write(msg: string) {
    fs.appendFileSync(logFilePath, msg);
}


export const logger = {
    info: (msg: string) => {
        write(formatMessage("INFO", msg));
    },
    warn: (msg: string) => {
        write(formatMessage("WARN", msg));
    },
    error: (msg: string) => {
        write(formatMessage("ERROR", msg));
    },
    errorUnknown: (error: unknown) => {
        write(formatMessage("ERROR", (error instanceof Error && error.stack) || String(error)));
    },
};
