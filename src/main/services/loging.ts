import fs from "fs";
import path from "path";
import { app } from "electron";

const logFilePath = path.join(app.getPath("userData"), "logging.log");

type Message = string | number;

function formatMessage(level: string, ...message: Message[]) {
    const timestamp = new Date().toISOString();
    const l = `[${timestamp}] [${level}] ${message.join(" ")}\n`;
    return l;
}

function write(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFilePath, msg);
}


export const logger = {
    info: (...message: Message[]) => {
        write(formatMessage("INFO", ...message));
    },
    warn: (...message: Message[]) => {
        write(formatMessage("WARN", ...message));
    },
    error: (...message: Message[]) => {
        write(formatMessage("ERROR", ...message));
    },
    errorUnknown: (error: unknown) => {
        write(formatMessage("ERROR", (error instanceof Error && error.stack) || String(error)));
    },
};
