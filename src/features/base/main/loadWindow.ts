import path from "path";
import { BrowserWindow } from "electron";

export function loadWindow(win: BrowserWindow, id: string) {
    const dev = process.env.DEV_SERVER_URL;
    return dev
        ? win.loadURL(`${dev}/${id}/index.html`)
        : win.loadFile(path.join(__dirname, "renderer", id, "index.html"));
}