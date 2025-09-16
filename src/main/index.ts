import { app, BrowserWindow, dialog } from "electron";

export let splashWin: BrowserWindow;
function createSplashWin() {
    splashWin = new BrowserWindow({
        width: 300, height: 200,
        frame: false, transparent: true,
        resizable: false,
        show: false
    });
    const html = `
        <html>
            <head>
                <style>
                body { 
                    margin:0; display:flex; 
                    justify-content:center; 
                    align-items:center; 
                    background:#1e1e1e; 
                    color:#fff; 
                    font-family:sans-serif;
                    user-select: none;
                }
                </style>
            </head>
            <body>
                <h2>Loading…</h2>
            </body>
        </html>
    `;

    splashWin.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    splashWin.once("ready-to-show", () => splashWin.show());

    return splashWin;
}
app.whenReady().then(async () => {
    createSplashWin();
    import("./mainWindow");
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
// app.on("will-quit", () => {
//     process.exit(0);
// });



process.on("uncaughtException", (err) => {
    // console.error("Uncaught Exception:", err);
    if (app.isReady()) {
        dialog.showErrorBox("ERROR", err.stack || err.message);
        console.error(err.stack || err.message);
    }
    if (BrowserWindow.getAllWindows().length <= 0) {
        app.quit();
    }
});

process.on("unhandledRejection", (reason: any) => {
    // console.error("Unhandled Rejection:", reason);
    if (app.isReady()) {
        dialog.showErrorBox("ERROR", String(reason));
        console.error(String(reason));
    }
    if (BrowserWindow.getAllWindows().length <= 0) {
        app.quit();
    }
});