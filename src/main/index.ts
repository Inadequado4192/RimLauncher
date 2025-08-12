import path from "path";
import fs from "fs";
import { app, BrowserWindow, dialog, session, shell } from "electron";
import { InitIPCEvents } from "./events/IPCEvents";
import { InitWebEvents } from "./events/WebEvents";
import { loadingLocal } from "@Common/Localize";
import { logger } from "./services/loging";




const MAIN_WINDOW_WEBPACK_ENTRY = process.env.NODE_ENV === "production" ? path.join(__dirname, "./index.html") : "http://localhost:3000";
const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = path.join(__dirname, "preload.js");
logger.info("START");






export let win: BrowserWindow;
function createWindow() {
    logger.info("Creating window");
    win = new BrowserWindow({
        title: `${app.getName()} v${app.getVersion()}`,

        width: 1400,
        height: 700,
        minHeight: 700,
        minWidth: 1000,

        show: false,
        // opacity: 0,


        movable: true,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // devTools: !app.isPackaged,
            webSecurity: false,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            additionalArguments: [`--appVersion=${app.getVersion()}`, `--appName=${app.getName()}`]
        },
        frame: false,
    });
    win.webContents.once("did-finish-load", () => {
        logger.info("win.webCont did-finish-load");
        win.show();
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("steam://")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    // if (!app.isPackaged) 
    win.webContents.openDevTools();

    win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(async () => {
    logger.info("[Event] app.whenReady");
    try {
        await loadingLocal();
        InitIPCEvents();
        InitWebEvents();
        createWindow();
        logger.info("[Event] app.whenReady OK");
    } catch (e) {
        logger.error("[Event] app.whenReady\n" + (e instanceof Error ? e.message : String(e)));
        throw e;
    }
    logger.info("[Event] app.whenReady Finally");



    app.on("activate", () => {
        logger.info("Event app on activate");
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    logger.info("[Event] window-all-closed");
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("will-quit", () => {
    logger.info("[Event] will-quit");
    process.exit(0);
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.





process.on("uncaughtException", (err) => {
    // console.error("Uncaught Exception:", err);
    if (app.isReady()) {
        dialog.showErrorBox("ERROR", err.stack || err.message);
    }
    if (BrowserWindow.getAllWindows().length <= 0) {
        app.quit();
    }
});

process.on("unhandledRejection", (reason: any) => {
    // console.error("Unhandled Rejection:", reason);
    if (app.isReady()) {
        dialog.showErrorBox("ERROR", String(reason));
    }
    if (BrowserWindow.getAllWindows().length <= 0) {
        app.quit();
    }
});
