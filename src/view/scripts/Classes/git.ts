export namespace GitSpace {
    type _url = string//`https://${string}.${string}`;

    export abstract class GitRepo {
        public abstract url: URL;
        public abstract get repoName(): string;

        public abstract parseInfo(repoUrl: _url): Promise<GitInfo["info"]>

        // public abstract getLastCommit(repoUrl: _url): any;
        public abstract checkUpdate(data: GitInfo): Promise<{ canBeUpdate: boolean }>;
    }



    class GitGudRepo extends GitRepo {
        public static url = new URL("https://gitgud.io");
        public static get repoName() { return this.url.host }
        public override url = GitGudRepo.url;
        public override get repoName() { return GitGudRepo.repoName }

        public override async parseInfo(repoUrl: _url) {
            let [, user, repo, tree] = new URL(repoUrl).pathname.replace(/\/$/, "").match(/\/?(.+?)\/(.+?)(?:$|\/-\/tree\/(.+))/) as [string, string, string, undefined | string];

            if (tree === undefined) {
                for (const posTree of ["master", "main"]) {
                    const res = await fetch(`${repoUrl}/-/tree/${posTree}`, { method: "HEAD" });
                    if (res.ok) {
                        tree = posTree;
                        break;
                    }
                }
            }

            if (!tree) throw Error("Tree not found.");

            return {
                repoUrl, user, repo, tree,
                downloadZipUrl: `https://${this.repoName}/${user}/${repo}/-/archive/${tree}/${repo}-${tree}.zip`
            };
        }

        public override async checkUpdate(data: GitInfo) {
            const { user, repo, tree } = data.info;
            const json = await fetch("https://gitgud.io/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: "query pathLastCommit($projectPath: ID!, $path: String, $ref: String!, $refType: RefType) {\n  project(fullPath: $projectPath) {\n    id\n    repository {\n      lastCommit(path: $path, ref: $ref, refType: $refType) {\n        id\n        sha\n        title\n        titleHtml\n        descriptionHtml\n        message\n        webPath\n        committerName\n        committedDate\n        authorName\n      }\n    }\n  }\n}",
                    variables: {
                        "path": "",
                        "projectPath": `${user}/${repo}`,
                        "ref": tree,
                        "refType": "HEADS"
                    }
                })
            }).then(async res => (await res.json()) as GitInfoRequest_GitGud_api_graphql);

            return {
                canBeUpdate: new Date(json.data.project.repository.lastCommit.committedDate).getTime() > data.lastUpdate
            }
        }
    }
    class GitHubRepo extends GitRepo {
        public static url = new URL("https://github.com");
        public static get repoName() { return this.url.host }
        public override url = GitHubRepo.url;
        public override get repoName() { return GitHubRepo.repoName }

        // public override async parseInfo(repoUrl: _url) {
        //     const html = await (await fetch(repoUrl)).text();

        //     const parser = new DOMParser();
        //     const doc = parser.parseFromString(html, "text/html");

        //     const [user, repo] = doc.querySelector<HTMLElement>("[aria-label=\"GitHub Breadcrumb\"]")!.innerText!.replace(/\s+/g, "").trim().split("/") as [string, string];
        //     const tree = doc.querySelector("#ref-picker-repos-header-ref-selector")!.textContent.trim();

        //     return {
        //         user, repo, tree,
        //         downloadZipUrl: `${this.url.origin}/${user}/${repo}/archive/refs/heads/${tree}.zip`
        //     }
        // }
        public override async parseInfo(repoUrl: _url) {
            const html = await (await fetch(repoUrl)).text();
            const [, obj] = html.match(/"initialPayload":(.+?),\s*"appPayload".+?<\/script/) as [any, string];
            const data = JSON.parse(obj);

            return {
                repoUrl,
                user: data.repo.ownerLogin,
                repo: data.repo.name,
                tree: data.refInfo.name,
                downloadZipUrl: this.url.origin + data.overview.codeButton.local.platformInfo.zipballUrl
            }
        }
        public override async checkUpdate(data: GitInfo) {
            const { user, repo, tree } = data.info;
            const res = await fetch(`https://github.com/${user}/${repo}/latest-commit/${tree}`, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            });
            const json = (await res.json()) as GitInfoRequest_GitHub_api;

            return {
                canBeUpdate: new Date(json.date).getTime() > data.lastUpdate
            }
        }
    }



    export const list: GitRepo[] = [
        new GitGudRepo(),
        new GitHubRepo(),
    ]

    export function getByUrl(repoUrl: _url): GitRepo | undefined;
    export function getByUrl(repoUrl: _url, withError: true): GitRepo;
    export function getByUrl(repoUrl: _url, withError: boolean = false) {
        const repo = list.find((git, index) => repoUrl.startsWith(git.url.origin));
        if (!repo && withError) throw new Error("Unknown hosting, ZIP is not supported");
        return repo;
    }
}