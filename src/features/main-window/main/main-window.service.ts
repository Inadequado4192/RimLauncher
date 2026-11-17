import path from "path";
import { app, BrowserWindow, dialog, shell } from "electron";
import { injectable } from "tsyringe";
import { Initializable, loadWindow } from "#features/base/main";
import { SplashWindowService } from "#features/splash/main";
import { LoggerService } from "#features/logger/main";
import { DevToolsService } from "#features/devtools/main";

@injectable()
export class MainWindowService implements Initializable {
    private win?: BrowserWindow;

    public constructor(
        private _splashWindowService: SplashWindowService,
        private _loggerService: LoggerService,
        private _devToolsService: DevToolsService,
    ) { }

    public async initialize() {
        await app.whenReady();
        await this.createWindow();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }


    private async createWindow() {
        if (this.win && !this.win.isDestroyed()) return;

        this._splashWindowService.create();

        this.win = new BrowserWindow({
            title: `${app.getName()} v${app.getVersion()}`,
            width: 1400, height: 700,
            minWidth: 1000, minHeight: 700,
            show: false,
            frame: false,
            fullscreenable: false,
            webPreferences: {
                preload: path.join(__dirname, "preload/main.js"),
                contextIsolation: true,
                nodeIntegration: false,
                // sandbox: true,
                // webSecurity: true,
                // allowRunningInsecureContent: false,
                // experimentalFeatures: false,
            },
        });

        const win = this.win;
        this._loggerService.attachWindow(win);

        win.on("page-title-updated", (e) => e.preventDefault());

        win.once("ready-to-show", () => {
            this._splashWindowService.destroy();
            win.show();
        });

        win.on("closed", () => {
            if (this.win === win) {
                this.win = undefined;
            }
        });


        win.webContents.setWindowOpenHandler(({ url }) => {
            this.openExternal(url);
            return { action: "deny" };
        });

        const devOrigin = process.env.DEV_SERVER_URL;
        win.webContents.on("will-navigate", (event, url) => {
            if (url.startsWith("chrome-extension://") || url.startsWith("devtools://")) return;
            if (devOrigin && url.startsWith(devOrigin)) return;
            if (url.startsWith("file://")) return;
            event.preventDefault();
            this.openExternal(url);
        });

        if (!app.isPackaged) {
            await this._devToolsService.ensureInstalled();
            if (!win.isDestroyed()) win.webContents.openDevTools();
        }

        try {
            await loadWindow(win, "main");
        } catch (err: any) {
            // logger.info("load failed", err);
            dialog.showErrorBox("Load failed", String(err?.message ?? err));
            this._splashWindowService.destroy();
        }
    }

    // system/main
    private readonly ALLOWED = new Set(["http:", "https:", "steam:"]);

    public openExternal(url: string) {
        let protocol: string;
        try { protocol = new URL(url).protocol; } catch { return; }
        if (this.ALLOWED.has(protocol)) void shell.openExternal(url);
    }
}