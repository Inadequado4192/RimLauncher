import { execFile, spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";
import { BrowserWindow, shell } from "electron";
import { injectable } from "tsyringe";
import { emitAll, handle, Initializable, IpcContext } from "#features/base/main";
import { UserConfigService } from "#features/user-config/main";
import { GamePathField, SteamPathField } from "#features/user-config/shared";
import { CloseAfterRunField, GameProcessIpc, GameState } from "../shared";
import { SteamGameId } from "#features/app/shared";
import { sleep } from "#features/base/shared";
import { GameExeNames, GameProcessNames } from "#features/game-info/main";

const run = promisify(execFile);
const POLL_MS = 2500;



@injectable()
export class GameProcessService implements Initializable {
    private state: GameState = { running: false, pid: null };
    private checking = false;
    private timer?: NodeJS.Timeout;

    public constructor(private _userConfig: UserConfigService) { }

    public initialize() {
        this._userConfig.registerField(CloseAfterRunField);

        handle(GameProcessIpc.GetState, async () => {
            await this.check();
            return this.state;
        });
        handle(GameProcessIpc.Launch, (ctx) => this.launch(ctx));
        handle(GameProcessIpc.Stop, () => this.stop());

        void this.check();
        this.timer = setInterval(() => {
            if (BrowserWindow.getAllWindows().length) void this.check();
        }, POLL_MS);
    }

    public dispose() {
        clearInterval(this.timer);
    }

    private async launch(ctx: IpcContext) {
        await this.check();
        if (this.state.running) return;

        const steamPath = await this._userConfig.getField(SteamPathField);
        if (steamPath) {
            await shell.openExternal(`steam://launch/${SteamGameId}`);
        } else {
            await this.spawnDirect();
        }

        for (let i = 0; i < 20 && !this.state.running; i++) {
            await sleep(500);
            await this.check();
        }

        if (this.state.running && await this._userConfig.getField(CloseAfterRunField)) {
            ctx.window?.close();
        }
    }

    private async spawnDirect() {
        const gamePath = await this._userConfig.getField(GamePathField);
        if (!gamePath) throw new Error("game-process.errors.noGamePath");


        const target = GameExeNames.find(exe => {
            const target = path.join(gamePath, exe);
            if (existsSync(target)) return target;
        });

        if (!target) throw new Error("game-process.errors.exeNotFound");

        const child = process.platform === "darwin"
            ? spawn("open", [target], { detached: true, stdio: "ignore" })
            : spawn(target, [], { cwd: gamePath, detached: true, stdio: "ignore" });
        child.unref();
    }

    private async stop() {
        await this.check();
        const { pid } = this.state;
        if (pid === null) return;
        try {
            process.kill(pid);
        } catch (err: any) {
            if (err?.code !== "ESRCH") throw err;
        }

        for (let i = 0; i < 20 && this.state.running; i++) {
            await sleep(500);
            await this.check();
        }
    }

    private async check() {
        if (this.checking) return;
        this.checking = true;
        try {
            const pid = await this.findPid();
            if (pid === this.state.pid) return;  
            this.state = { running: pid !== null, pid };
            emitAll(GameProcessIpc.OnStateChange, this.state);
        } catch (err) {
            console.error("game-process check failed", err);
        } finally {
            this.checking = false;
        }
    }

    private async findPid(): Promise<number | null> {
        if (process.platform === "win32") {
            for (const processName of GameProcessNames) {
                const { stdout } = await run("tasklist", ["/FI", `IMAGENAME eq ${processName}`, "/FO", "CSV", "/NH"]);
                const line = stdout.split(/\r?\n/)
                    .find((l) => l.toLowerCase().startsWith(`"${processName.toLowerCase()}","`));
                const pid = line ? Number(line.split('","')[1]) : NaN;
                if (Number.isFinite(pid)) return pid;
            }
            return null;
        }
        for (const processName of GameProcessNames) {
            try {
                const { stdout } = await run("pgrep", ["-x", processName]);
                const pid = Number(stdout.trim().split("\n")[0]);
                if (Number.isFinite(pid)) return pid;
            } catch {
                // pgrep: код 1, якщо процесу немає
            }
        }
        return null;
    }
}