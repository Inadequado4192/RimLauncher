import { app, BrowserWindow } from "electron";
import { injectable } from "tsyringe";
import fs from "node:fs";
import path from "node:path";
import { Initializable } from "#features/base/main";

@injectable()
export class LoggerService implements Initializable {
    private logFilePath = path.join(app.getPath("userData"), ".log");
    private readonly maxLogSize = 5 * 1024 * 1024; // 5 MB

    public initialize(): void {
        if (fs.existsSync(this.logFilePath)) {
            const stats = fs.statSync(this.logFilePath);

            if (stats.size >= this.maxLogSize) {
                fs.writeFileSync(this.logFilePath, "");
            }
        }

        this.info("Logger initialized", {
            version: app.getVersion(),
            isPackaged: app.isPackaged,
        });
    }

    public info(message: string, details?: unknown): void {
        this.write("INFO", message, details);
    }

    public warn(message: string, details?: unknown): void {
        this.write("WARN", message, details);
    }

    public error(message: string, details?: unknown): void {
        this.write("ERROR", message, details);
    }

    public attachWindow(window: BrowserWindow): void {
        window.webContents.on(
            "console-message",
            (details) => {
                if (details.level === "debug" || details.level === "info") return;

                this.write(details.level === "warning" ? "WARN" : "ERROR", details.message, {
                    lineNumber: details.lineNumber,
                    sourceId: details.sourceId,
                });
            },
        );

        window.webContents.on(
            "did-fail-load",
            (_, errorCode, errorDescription, validatedURL, isMainFrame) => {
                this.error("Renderer failed to load", {
                    errorCode,
                    errorDescription,
                    validatedURL,
                    isMainFrame,
                });
            },
        );

        window.webContents.on("render-process-gone", (_, details) => {
            this.error("Renderer process gone", details);
        });
    }

    private write(
        level: string,
        message: string,
        details?: unknown,
    ): void {
        const timestamp = new Date().toISOString();

        let content = `[${timestamp}] [${level}] ${message}`;

        if (details !== undefined) {
            content += `\n${this.stringify(details)}`;
        }

        content += "\n\n";

        try {
            fs.appendFileSync(this.logFilePath, content, "utf8");
        } catch (error) {
            console.error("Failed to write log:", error);
        }
    }

    private stringify(value: unknown): string {
        if (value instanceof Error) {
            return value.stack ?? `${value.name}: ${value.message}`;
        }

        try {
            return JSON.stringify(
                value,
                (_, item) =>
                    item instanceof Error
                        ? {
                            name: item.name,
                            message: item.message,
                            stack: item.stack,
                        }
                        : item,
                2,
            );
        } catch {
            return String(value);
        }
    }
}