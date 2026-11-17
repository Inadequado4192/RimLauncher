import { EventEmitter } from "events";
import { BrowserWindow } from "electron";
import { injectable } from "tsyringe";


enum SplashWindowServiceEvent {
    Closed = "closed",
}

type SplashWindowServiceEvents = {
    [SplashWindowServiceEvent.Closed]: [];
};

@injectable()
export class SplashWindowService extends EventEmitter<SplashWindowServiceEvents> {
    private win?: BrowserWindow;

    public constructor() {
        super();
    }

    public create() {
        if (this.win && !this.win.isDestroyed()) return;

        this.win = new BrowserWindow({
            width: 300, height: 200,
            frame: false, transparent: true,
            resizable: false,
            show: false,
        });
        this.win.once("ready-to-show", () => this.win?.show());

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
</html>`;

        this.win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    }

    public destroy() {
        this.win?.close();
        this.win = undefined;
        this.emit(SplashWindowServiceEvent.Closed);
    }
}