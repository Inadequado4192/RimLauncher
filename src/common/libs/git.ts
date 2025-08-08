export namespace GitSpace {
    type _url = string//`https://${string}.${string}`;
    type GetName<URL extends _url> = URL extends `https://${infer N extends string}` ? N : string;

    interface IGit<URL extends _url> {
        url: URL,
        parseRepo: (url: string) => {
            user: string,
            repo: string,
            tree: string,
        }
    }
    interface IGitRepo {
        url: _url,
        info: {
            user: string,
            repo: string,
            tree: string,
        }
    }
    export class Git<URL extends _url = _url> implements IGit<URL> {
        public url: IGit<URL>["url"];
        public parseRepo: IGit<URL>["parseRepo"];

        public get name() { return new URL(this.url).host as GetName<URL>; }

        public constructor(data: IGit<URL>) {
            this.url = data.url;
            this.parseRepo = data.parseRepo;
        }

        public getRepo(url: _url): GitRepo {
            const gitUrl = new URL(this.url);
            const repoUrl = new URL(url);
            if (repoUrl.hostname !== gitUrl.hostname) throw Error("Wrong hostname");


            return new GitRepo({
                url,
                info: this.parseRepo(url)
            }, this)
        }
    }
    export class GitRepo {
        public urlrepo: IGitRepo["url"];
        public info: IGitRepo["info"];
        public git: Git;

        public constructor(data: IGitRepo, git: Git) {
            this.urlrepo = data.url;
            this.info = data.info;
            this.git = git;
        }

        public getDownloadUrl(format: "zip" | "tar" | "tar.gz" | "tar.gz" = "zip") {
            const { user, repo, tree } = this.info;
            return `https://${this.git.name}/${user}/${repo}/-/archive/${tree}/${repo}-${tree}.${format}`;
        }
    }

    namespace List {
        export const GitGud = new Git({
            url: "https://gitgud.io",
            parseRepo(url) {
                let [, user, repo, tree] = new URL(url).pathname.match(/^\/(.+?)\/(.+?)(?:\/-\/tree\/(.+?))?$/) as [never, string, string, string | undefined];
                tree ??= "master";
                return { user, repo, tree };
            },
        });
    }

    export function getByUrl(repoUrl: _url) {
        return GitSpace.list.find((git, index) => repoUrl.startsWith(git.url));
    }

    export const list = [List.GitGud];
}