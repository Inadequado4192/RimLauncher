import fs from "fs";
import { Pathes, PathesMaker } from "main/Pathes";
import path from "path";
import yauzl from "yauzl";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import Schemes from "main/Schemes";
import fetch from "node-fetch";
import z from "zod";
import { tmpdir } from "os";

namespace GitActions {
    function extractZip(
        zipPath: string,
        dest: string,
        onProgress?: (percent: number) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            yauzl.open(zipPath, { lazyEntries: true }, (err, zip) => {
                if (err || !zip) return reject(err);

                fs.mkdirSync(dest, { recursive: true });

                let processed = 0;
                const total = zip.entryCount;

                zip.readEntry();
                zip.on("entry", (entry) => {
                    const outPath = path.join(dest, entry.fileName);

                    const updateProgress = () => {
                        processed++;
                        onProgress?.(processed / total);
                    };

                    if (/\/$/.test(entry.fileName)) {
                        fs.mkdirSync(outPath, { recursive: true });
                        updateProgress();
                        zip.readEntry();
                    } else {
                        fs.mkdirSync(path.dirname(outPath), { recursive: true });
                        zip.openReadStream(entry, (err, rs) => {
                            if (err || !rs) return reject(err);
                            const ws = fs.createWriteStream(outPath);
                            rs.pipe(ws);
                            rs.on("end", () => {
                                updateProgress();
                                zip.readEntry();
                            });
                        });
                    }
                });

                zip.on("end", resolve);
                zip.on("error", reject);
            });
        });
    }

    async function cloneGitToTempDir(params: {
        git: GitInfo["info"],
        tmpDirPath: string,
        onProgress?: (percent: number, message: string) => void
    }) {
        // Тимчасова папка для розпакування ZIP (бо всередині є вкладена папка)
        const tmpDirPath = params.tmpDirPath;
        const tmpZipPath = path.join(tmpdir(), `repo-${Date.now()}.zip`);
        let __finished = false;
        try {

            const progress = new ProgressManager((percent, message) => params.onProgress?.(percent, message ?? ""));
            const progress_downloadingZip = progress.createStageReporter(0.3, "Downloading zip...");
            const progress_unpackingZip = progress.createStageReporter(0.6, "Unpacking zip...");
            const progress_preparation = progress.createStageReporter(0.1, "Preparation");



            // Завантаження ZIP-файлу
            const res = await fetch(params.git.downloadZipUrl);
            if (!res.ok) throw new Error(`ZIP upload error: ${res.statusText}`);
            if (!res.body) throw new Error("Empty response body");



            let contentLength = Number(res.headers.get("content-length")) || null;
            let downloaded = 0;

            if (contentLength == null) {
                (async function waitForContentLength() {
                    try {
                        if (__finished) return;
                        const res = await fetch(params.git.downloadZipUrl);
                        const cl = Number(res.headers.get("content-length")) || null;
                        if (cl !== null) contentLength = cl;
                        else setTimeout(waitForContentLength, 2000);
                    } catch { }
                })();
            }

            // Створюємо трансформ-потік для відстеження прогресу
            const progressStream = new Transform({
                transform(chunk, _encoding, callback) {
                    downloaded += chunk.length;
                    progress_downloadingZip(contentLength ? downloaded / contentLength : 0);
                    callback(null, chunk);
                },
            });

            progress.setCurrentStage(0);
            await pipeline(res.body, progressStream, fs.createWriteStream(tmpZipPath));
            progress_downloadingZip(1);


            progress.setCurrentStage(1);
            await extractZip(tmpZipPath, tmpDirPath, progress_unpackingZip);
            await new Promise(resolve => setTimeout(resolve, 100)); // wait...



            progress.setCurrentStage(2);
            const [subDirName] = fs.readdirSync(tmpDirPath) as [string];
            const subDirPath = (function findModDir(dirPath: string) {
                const maybeAt = [/^\.?dist$/i, /^\.?out$/i]

                for (const fileName of fs.readdirSync(dirPath)) {
                    for (const reg of maybeAt) {
                        if (reg.test(fileName)) {
                            return path.join(dirPath, fileName)
                        }
                    }
                }

                return dirPath;
            })(path.join(tmpDirPath, subDirName));

            {
                // Видалення непотрібних файлів...
                for (const fileName of fs.readdirSync(subDirPath)) {
                    if (/^\.|^Source$/i.test(fileName)) {
                        const filePath = path.join(subDirPath, fileName);
                        fs.rmSync(filePath, { force: true, recursive: true });
                    }
                }
            }
            {
                const pathToGitInfo = path.join(subDirPath, PathesMaker.gitinfo);
                if (!fs.existsSync(pathToGitInfo)) {
                    fs.writeFileSync(
                        pathToGitInfo,
                        Schemes.GitInfo.Write.parse({
                            info: params.git,
                            lastUpdate: Date.now(),
                        } satisfies GitInfo_Types["WriteIn"])
                    );
                }
            }
            progress_preparation(1);

            return { subDirPath };
        } catch (error) {
            fs.rmSync(tmpDirPath, { recursive: true, force: true });
            throw error;
        } finally {
            __finished = true;
            fs.rmSync(tmpZipPath, { force: true });
        }
    }



    export async function downloadGitMod(params: {
        git: GitInfo["info"],
        onProgress?: (percent: number, message: string) => void
    }) {
        if (!Pathes.Dir_LocalMods) throw Error("Path to local mods not found");
        const progress = new ProgressManager((percent, message) => params?.onProgress?.(percent, message ?? ""));
        const progress_cloneGitToTempDir = progress.createStageReporter(1);


        const dirName = crypto.randomUUID();
        const tmpDirPath = path.join(Pathes.Dir_LocalMods, `~${dirName}`);
        const resDirPath = path.join(Pathes.Dir_LocalMods, dirName);

        progress.setCurrentStage(0);
        const { subDirPath } = await cloneGitToTempDir({
            git: params.git,
            tmpDirPath: tmpDirPath,
            onProgress: progress_cloneGitToTempDir
        });

        fs.renameSync(subDirPath, resDirPath);
        fs.rmSync(tmpDirPath, { recursive: true, force: true });
    }

    export async function updateGitMod(params: {
        pathToGitMod: string,
        onProgress?: (percent: number, message: string) => void
    }) {
        if (!Pathes.Dir_LocalMods) throw Error("Path to local mods not found");
        const gitinfo = Schemes.GitInfo.Read.parse(fs.readFileSync(path.join(params.pathToGitMod, PathesMaker.gitinfo).toString()));

        const progress = new ProgressManager((percent, message) => params.onProgress?.(percent, message ?? ""));
        const progress_cloneGitToTempDir = progress.createStageReporter(1, "Downloading zip...");

        const tmpDirPath = path.join(Pathes.Dir_LocalMods, `~${path.basename(params.pathToGitMod)}`);

        progress.setCurrentStage(0);
        const { subDirPath } = await cloneGitToTempDir({
            git: gitinfo.info,
            tmpDirPath: tmpDirPath,
            onProgress: progress_cloneGitToTempDir,
        });


        fs.rmSync(params.pathToGitMod, { recursive: true, force: true });
        fs.renameSync(subDirPath, params.pathToGitMod);
        fs.rmSync(tmpDirPath, { recursive: true, force: true });
    }






    /**
     * @param percent `0-1`
     */
    type ProgressCallback = (percent: number, message?: string) => void;

    class ProgressManager {
        private totalWeight = 0;
        private stages: { weight: number; done: number; message?: string }[] = [];
        private onProgress?: ProgressCallback;
        private currentStageIndex: number | null = null;

        constructor(onProgress?: ProgressCallback) {
            this.onProgress = onProgress;
        }

        private addStage(weight: number, message?: string): number {
            const index = this.stages.length;
            this.stages.push({ weight, done: 0, message });
            this.totalWeight += weight;
            return index;
        }

        private update(stageIndex: number, stageProgress: number, message?: string) {
            const stage = this.stages[stageIndex]!;
            stage.done = stageProgress;
            if (message !== undefined) {
                stage.message = message;
            }

            const overall =
                this.stages.reduce((sum, s) => sum + s.done * s.weight, 0) /
                this.totalWeight;

            const displayMessage =
                this.currentStageIndex !== null
                    ? this.stages[this.currentStageIndex]?.message
                    : undefined;

            this.onProgress?.(overall * 100, displayMessage);
        }

        public setCurrentStage(index: number, name?: string) {
            this.currentStageIndex = index;
            if (name !== undefined) {
                this.stages[index]!.message = name;
            }
        }

        public createStageReporter(weight: number, name?: string): ProgressCallback {
            const index = this.addStage(weight, name);
            return (percent, message) => this.update(index, percent / 100, message);
        }
    }

}

export default GitActions