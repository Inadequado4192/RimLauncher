import fs from "fs/promises";
import path from "path";
import { injectable } from "tsyringe";
import { emitAll, handle, Initializable } from "#features/base/main";
import { GitInfo, gitInfoCreateSchema, GitInfoFileName, gitInfoReadSchema, GitIpc, GitModType, GitProvider, GitRepoInfo, InstallEvent } from "../shared";
import { ModTypeRegistry } from "#features/mod-type/main";
import z from "zod";
import { UserConfigService } from "#features/user-config/main";
import { app, BrowserWindow, shell } from "electron";
import { downloadViaHiddenWindow } from "#features/file-system/main";
import { extractArchive, inspectArchive } from "#features/archive/main";
import { minutes} from "#features/time/shared";
import { Cache, CacheService } from "#features/cache/main";

@injectable()
export class GitModTypeService implements Initializable {
    private instalationChange = new Map<string, {
        repoInfo: GitInfo["repo"]
    }>();

    private latestSha: Cache<string>;

    public constructor(
        private readonly _modTypeRegistry: ModTypeRegistry,
        private readonly _userConfigService: UserConfigService,
        private readonly _cacheService: CacheService,
    ) {
        this.latestSha = this._cacheService.namespace("git-latest", minutes(30));
    }


    private send = (installId: string) => (e: Omit<Extract<InstallEvent, { type: "progress" }>, "installId" | "type">) =>
        emitAll(GitIpc.InstallEvent, { installId, type: "progress", ...e });

    public initialize() {
        this._modTypeRegistry.register(GitModType, {
            priority: 10,
            async detect({ dirPath }) {
                const file = path.join(dirPath, GitInfoFileName);
                let json: string;
                try { json = JSON.parse(await fs.readFile(file, "utf8")); }
                catch { return null; }

                const parsed = gitInfoReadSchema.safeParse(json!);
                return {
                    gitInfo: parsed.success
                        ? { ok: true as const, data: parsed.data }
                        : { ok: false as const, error: { key: "git.errors.badGitInfo" as const, args: [z.prettifyError(parsed.error)] } },
                };
            },
        });

        handle(GitIpc.InstallStart, async (_, source) => {
            if ("url" in source) {
                const repoInfo = await this.parseGitUrl(source.url);;

                return this.startDownloadArchive(repoInfo);
            } else {
                if (!source.mod.data.gitInfo.ok) throw Error("gitInfo is broken");

                return this.startDownloadArchive(source.mod.data.gitInfo.data.repo);
            }
        });


        handle(GitIpc.InstallConfirm, async (_, installId, opts) => {
            const progress = this.send(installId);
            let pathToArchiveFile: string | null = null;
            let pathTotmpUnzippedDir: string | null = null;
            try {
                const { local } = await this._userConfigService.getModsPaths();
                if (!local) throw new Error("no local mods path");

                pathToArchiveFile = this.createPathToArchive(installId);
                pathTotmpUnzippedDir = path.join(local, `~${installId}`);
                const pathTotmpNewModDir = path.join(local, installId);

                progress({ stage: "unzip", percent: 0 });
                await extractArchive(pathToArchiveFile, pathTotmpUnzippedDir, opts.excludeFiles, (p) =>
                    progress({ stage: "unzip", percent: p.percent, details: "unziping..." }));

                const installData = this.instalationChange.get(installId);
                if (installData) {
                    const rawJson = JSON.stringify(gitInfoCreateSchema.parse({
                        repo: installData.repoInfo,
                        // settings: {
                        //     modSubdir: "./",
                        //     excludeFiles: opts.excludeFiles.map(p => p.replace(new RegExp(`^${opts.rootDirectory.replace(/\//g, "")}/`), ""))
                        // },
                        state: {
                            installedVersionCommit: await this.getLastCommit(installData.repoInfo)
                        }
                    } satisfies GitInfo), null, 4);
                    await fs.writeFile(path.join(pathTotmpUnzippedDir, opts.rootDirectory, GitInfoFileName), rawJson);
                } else {
                    throw Error("installData doens't exist");
                }

                progress({ stage: "move", percent: null, details: "moving..." });
                await fs.rename(path.join(pathTotmpUnzippedDir, opts.rootDirectory), pathTotmpNewModDir);

                progress({ stage: "cleanup", percent: null, details: "cleanup..." });

                await fs.rm(pathTotmpUnzippedDir, { recursive: true, force: true });
                await fs.rm(pathToArchiveFile, { force: true });

                emitAll(GitIpc.InstallEvent, { installId, type: "done" });
            } catch (error: any) {
                emitAll(GitIpc.InstallEvent, { installId, type: "error", error: error.message });

                if (pathTotmpUnzippedDir) await fs.rm(pathTotmpUnzippedDir, { recursive: true, force: true });
                if (pathToArchiveFile) await fs.rm(pathToArchiveFile, { force: true });
            } finally {
                this.instalationChange.delete(installId);
            }
        });

        handle(GitIpc.CheckUpdates, async (_, info) => {
            const hasUpdateSha = await Promise.all(
                info.map(async i => {
                    const latest = await this.latestSha.getOrLoad(
                        `${i.repo.owner}/${i.repo.name}@${i.repo.ref}`,
                        async () => await this.getLastCommit(i.repo)
                    );

                    const installed = i.state.installedVersionCommit;
                    return latest !== installed ? installed : null;
                })
            );

            return {
                hasUpdateSha: hasUpdateSha.filter(
                    (sha): sha is string => sha !== null
                )
            };
        });

        handle(GitIpc.OpenModConfig, (_, gitMod) => void shell.openPath(path.join(gitMod.dirPath, GitInfoFileName)));

        handle(GitIpc.DeleteMod, async (_, gitMod) => {
            await fs.rm(gitMod.dirPath, { force: true, recursive: true });
        });
    }



    private startDownloadArchive(repoInfo: GitInfo["repo"]) {
        const zipUrl = this.getArchiveUrl(repoInfo);
        const installId = crypto.randomUUID();

        const progress = this.send(installId);

        const pathToZip = this.createPathToArchive(installId);

        downloadViaHiddenWindow(zipUrl, pathToZip, {
            headers: {},
            onProgress: (p) => {
                progress({
                    stage: "download",
                    percent: p.percent,
                    details: "downloading...",
                });
            },
        })
            .then(async () => {
                this.instalationChange.set(installId, { repoInfo });
                emitAll(GitIpc.InstallEvent, {
                    installId,
                    type: "inspected",
                    archive: await inspectArchive(pathToZip)
                });
            })
            .catch(error => {
                emitAll(GitIpc.InstallEvent, {
                    installId,
                    type: "error",
                    error: String(error)
                });
            });

        return { installId };
    }


    private createPathToArchive(installId: string) {
        return path.join(app.getPath("temp"), `${installId}.zip`);
    }

    private getArchiveUrl = ({ name, owner, provider, ref }: GitRepoInfo) => {
        return byProvider(provider, {
            gitgud: () => `https://gitgud.io/api/v4/projects/${encodeURIComponent(`${owner}/${name}`)}/repository/archive.zip?sha=${encodeURIComponent(ref)}`,
            github: () => `https://api.github.com/repos/${owner}/${name}/zipball/${encodeURIComponent(ref)}`,
        });
    }

    private getProviderFromHostname(hostname: string): GitProvider {
        const lowerHost = hostname.toLowerCase();

        if (lowerHost.includes("github.com")) {
            return "github";
        }
        if (lowerHost.includes("gitgud.io") || lowerHost.includes("gitlab")) {
            return "gitgud";
        }

        throw new Error(`Unknown host provider: ${hostname}`);
    }

    private async parseGitUrl(inputUrl: string): Promise<GitRepoInfo> {
        const url = new URL(inputUrl);
        const hostname = url.hostname.toLowerCase();

        const provider = this.getProviderFromHostname(hostname);

        const segments = url.pathname.split("/").filter(Boolean);
        const owner = segments[0];
        const repoName = segments[1]?.replace(/\.git$/, "");

        if (!owner || !repoName) {
            throw new Error("Incorrect link to the repository");
        }

        let ref: string | null = null;

        // GitLab / GitGud
        const treeIndexGitLab = segments.indexOf("tree");
        if (treeIndexGitLab !== -1 && segments[treeIndexGitLab - 1] === "-") {
            ref = segments[treeIndexGitLab + 1] || null;
        }
        // GitHub
        else if (segments[2] === "tree" || segments[2] === "blob") {
            ref = segments[3] || null;
        }

        ref ??= await this.getDefaultBranch({ provider, name: repoName, owner });

        return { provider, owner, name: repoName, ref };
    }

    private getLastCommit({ name, owner, provider, ref }: GitRepoInfo) {
        return byProvider(provider, {
            async github() {
                const response = await fetch(`https://api.github.com/repos/${owner}/${name}/commits/${encodeURIComponent(ref)}`,);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const data: {
                    sha: string;
                    commit: {
                        committer: {
                            date: string;
                        };
                    };
                } = await response.json();

                return data.sha;
            },
            async gitgud() {
                const projectId = encodeURIComponent(`${owner}/${name}`);

                const response = await browserFetch<{ id: string; }>(`https://gitgud.io/api/v4/projects/${projectId}/repository/commits/${encodeURIComponent(ref)}`);

                if (!response.ok) throw new Error(`GitGud API error: ${response.text}`);

                const data = await response.json();

                return data.id;
            },
        });
    }

    private getDefaultBranch({ owner, provider, name }: Pick<GitRepoInfo, "owner" | "name" | "provider">): Promise<string> {
        return byProvider(provider, {
            async github() {
                const response = await fetch(`https://api.github.com/repos/${owner}/${name}`);

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const data: {
                    default_branch: string
                } = await response.json();

                return data.default_branch;
            },
            async gitgud() {
                const projectId = encodeURIComponent(`${owner}/${name}`);

                const response = await browserFetch<{ default_branch: string }>(`https://gitgud.io/api/v4/projects/${projectId}`);

                if (!response.ok) {
                    throw new Error(`GitGud API error: ${response.text}`);
                }

                const data = await response.json();

                if (!data.default_branch) throw new Error("GitGud project has no default branch");

                return data.default_branch;
            },
        });
    }
}

const byProvider = <T>(provider: GitProvider, map: Record<GitProvider, () => T>): T => map[provider]();



async function browserFetch<T>(url: string) {
    const win = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: true,
        },
    });

    try {
        await win.loadURL(url);

        const result = await win.webContents.executeJavaScript("document.body.innerText");

        return {
            ok: true,
            text: result,
            json: () => JSON.parse(result) as T
        } as const;
    } catch (e) {
        console.error(e);
        return {
            ok: false,
            text: String(e)
        } as const;
    } finally {
        win.close();
    }
}