import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { app, BrowserWindow, dialog, session, shell } from "electron";
import { InitIPCEvents } from "./events/IPCEvents";
import { InitWebEvents } from "./events/webEvents";
import { loadingLocal } from "@Common/Localize";
import { logger } from "./services/loging";
import { splashWin } from ".";
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";


const MAIN_WINDOW_WEBPACK_ENTRY =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000/"
        : pathToFileURL(path.join(__dirname, "index.html")).toString();
const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = path.join(__dirname, "preload.js");


export let win: BrowserWindow;
function createWindow() {
    // const splashWin = createSplashWin();

    win = new BrowserWindow({
        title: `${app.getName()} v${app.getVersion()}`,

        width: 1400,
        height: 700,
        minHeight: 700,
        minWidth: 1000,

        show: false,

        movable: true,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            additionalArguments: [`--appVersion=${app.getVersion()}`, `--appName=${app.getName()}`]
        },
        frame: false,
    });

    win.webContents.once("dom-ready", () => {
        logger.info("[Event] win.webContents dom-ready");
        splashWin.close();
        win.show();
    });
    win.webContents.on("did-fail-load", (event, code, desc, url) => {
        logger.info("did-fail-load", code, desc, url);
        dialog.showErrorBox("did-fail-load", `ERROR: ${code}\n${desc}\n${url}`);
        splashWin.close();
    });

    win.webContents.setWindowOpenHandler(({ url, ...props }) => {
        if (url.startsWith("steam://")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });
    win.webContents.on("will-navigate", (event, url) => {
        if (url.startsWith("http") && url !== MAIN_WINDOW_WEBPACK_ENTRY) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });


    if (!app.isPackaged) {
        win.webContents.openDevTools();

        installExtension(REACT_DEVELOPER_TOOLS, {
            loadExtensionOptions: { allowFileAccess: true }
        })
            .then(ext => {
                console.log(`Added Extension: ${ext.name}`);
            })
            .catch(err => {

                console.error("Failed to install extension:", err);
            })
    }

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
    } catch (e) {
        logger.error("[Event] app.whenReady\n" + (e instanceof Error ? e.message : String(e)));
        throw e;
    }



    app.on("activate", () => {
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



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.





// process.on("uncaughtException", (err) => {
//     // console.error("Uncaught Exception:", err);
//     if (app.isReady()) {
//         dialog.showErrorBox("ERROR", err.stack || err.message);
//         console.error(err.stack || err.message);
//     }
//     if (BrowserWindow.getAllWindows().length <= 0) {
//         app.quit();
//     }
// });

// process.on("unhandledRejection", (reason: any) => {
//     // console.error("Unhandled Rejection:", reason);
//     if (app.isReady()) {
//         dialog.showErrorBox("ERROR", String(reason));
//         console.error(String(reason));
//     }
//     if (BrowserWindow.getAllWindows().length <= 0) {
//         app.quit();
//     }
// });
