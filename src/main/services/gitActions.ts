import { GitSpace } from "@Common/libs/git";
import fs from "fs";
import { Pathes, PathesMaker } from "main/Pathes";
import path from "path";
import { promisify } from "util";
import unzipper from 'unzipper';
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { webEvents } from "@Events/WebEvents";
import ModListActions from "./modListActions";
import Schemes from "main/Schemes";
import { app } from "electron";
import fetch from "node-fetch";

namespace GitActions {
    // Формує URL на ZIP-архів репозиторію в залежності від хостингу
    async function getZipRepoUrl(repoUrl: string) {
        repoUrl = repoUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');

        const git = GitSpace.getByUrl(repoUrl);
        if (git) {
            return (await git.getRepo(repoUrl)).getDownloadUrl();
        } else {
            throw new Error("Unknown hosting, ZIP is not supported");
        }
    }

    async function cloneGitToTempDir(params: {
        url: string,
        tmpDirPath: string,
        onProgress?: (percent: number) => void
    }) {
        // Тимчасова папка для розпакування ZIP (бо всередині є вкладена папка)
        const tmpDirPath = params.tmpDirPath;
        try {
            // Завантаження ZIP-файлу
            const res = await fetch(await getZipRepoUrl(params.url));
            if (!res.ok) throw new Error(`ZIP upload error: ${res.statusText}`);
            if (!res.body) throw new Error("Empty response body");

            // Створення тимчасової директорії
            fs.mkdirSync(tmpDirPath, { recursive: true });


            const contentLength = Number(res.headers.get("content-length"));
            let downloaded = 0;

            // Створюємо трансформ-потік для відстеження прогресу
            const progressStream = new Transform({
                transform(chunk, _encoding, callback) {
                    downloaded += chunk.length;
                    const percent = downloaded / contentLength;
                    params.onProgress?.(percent);
                    callback(null, chunk);
                },
            });

            // Передаємо потік через прогрес і далі у unzip
            await pipeline(
                res.body,
                progressStream,
                unzipper.Extract({ path: tmpDirPath })
            );
            await new Promise(resolve => setTimeout(resolve, 100)); // wait...

            const [subDirName] = fs.readdirSync(tmpDirPath) as [string];
            const subDirPath = path.join(tmpDirPath, subDirName);

            return { subDirPath };
        } catch (error) {
            // Обробка помилок
            fs.rmSync(tmpDirPath, { recursive: true, force: true });
            throw error;
        }
    }



    export async function downloadGitMod(opt: {
        url: string,
        onProgress?: (percent: number, message: string) => void
    }) {
        if (!Pathes.Dir_LocalMods) throw Error("Path to local mods not found");
        const progress = new ProgressManager((percent, message) => opt?.onProgress?.(percent, message ?? ""));
        const progress_cloneGitToTempDir = progress.createStageReporter(0.9, "Downloading zip...");
        const progress_completion = progress.createStageReporter(0.1, "Completion...");


        const dirName = crypto.randomUUID();
        const tmpDirPath = path.join(Pathes.Dir_LocalMods, `~${dirName}`);
        const resDirPath = path.join(Pathes.Dir_LocalMods, dirName);

        progress.setCurrentStage(0);
        const { subDirPath } = await cloneGitToTempDir({
            url: opt.url,
            tmpDirPath: tmpDirPath,
            onProgress: progress_cloneGitToTempDir
        });

        progress.setCurrentStage(1);
        fs.renameSync(subDirPath, resDirPath);
        fs.writeFileSync(path.join(resDirPath, PathesMaker.gitinfo), JSON.stringify(Schemes.GitInfo.parse({
            url: opt.url,
            lastUpdate: Date.now()
        })), "utf8");
        fs.rmSync(tmpDirPath, { recursive: true, force: true });
        progress_completion(100);
    }
    export async function updateGitMod(pathToGitMod: string, opt?: {
        onProgress?: (percent: number, message: string) => void
    }) {
        if (!Pathes.Dir_LocalMods) throw Error("Path to local mods not found");
        const gitinfo = Schemes.GitInfo.parse(JSON.parse(fs.readFileSync(path.join(pathToGitMod, PathesMaker.gitinfo)).toString()));

        const progress = new ProgressManager((percent, message) => opt?.onProgress?.(percent, message ?? ""));
        const progress_cloneGitToTempDir = progress.createStageReporter(0.9, "Downloading zip...");
        const progress_completion = progress.createStageReporter(0.1, "Completion...");

        const tmpDirPath = path.join(Pathes.Dir_LocalMods, `~${path.basename(pathToGitMod)}`);

        progress.setCurrentStage(0);
        const { subDirPath } = await cloneGitToTempDir({
            url: gitinfo.url,
            tmpDirPath: tmpDirPath,
            onProgress: progress_cloneGitToTempDir,
        });

        progress.setCurrentStage(1);
        fs.rmSync(pathToGitMod, { recursive: true, force: true });
        fs.renameSync(subDirPath, pathToGitMod);
        fs.writeFileSync(path.join(pathToGitMod, PathesMaker.gitinfo), JSON.stringify(Schemes.GitInfo.parse({
            url: gitinfo.url,
            lastUpdate: Date.now()
        })), "utf8");
        fs.rmSync(tmpDirPath, { recursive: true, force: true });
        progress_completion(100);
    }






    type ProgressCallback = (percent: number, message?: string) => void;

    class ProgressManager {
        private totalWeight = 0;
        private stages: { weight: number; done: number; name?: string }[] = [];
        private onProgress?: ProgressCallback;
        private currentStageIndex: number | null = null;

        constructor(onProgress?: ProgressCallback) {
            this.onProgress = onProgress;
        }

        private addStage(weight: number, name?: string): number {
            const index = this.stages.length;
            this.stages.push({ weight, done: 0, name });
            this.totalWeight += weight;
            return index;
        }

        private update(stageIndex: number, stageProgress: number, message?: string) {
            const stage = this.stages[stageIndex]!;
            stage.done = stageProgress;
            if (message !== undefined) {
                stage.name = message;
            }

            const overall =
                this.stages.reduce((sum, s) => sum + s.done * s.weight, 0) /
                this.totalWeight;

            const displayMessage =
                this.currentStageIndex !== null
                    ? this.stages[this.currentStageIndex]?.name
                    : undefined;

            this.onProgress?.(overall * 100, displayMessage);
        }

        public setCurrentStage(index: number, name?: string) {
            this.currentStageIndex = index;
            if (name !== undefined) {
                this.stages[index]!.name = name;
            }
        }

        public createStageReporter(weight: number, name?: string): (percent: number, message?: string) => void {
            const index = this.addStage(weight, name);
            return (percent, message) => this.update(index, percent / 100, message);
        }
    }

}

export default GitActions