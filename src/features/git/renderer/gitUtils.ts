import { GitInfo, } from "../shared";

export function getRepoUrl(gitInfo: GitInfo) {
    switch (gitInfo.repo.provider) {
        case "github": return `https://github.com/${gitInfo.repo.owner}/${gitInfo.repo.name}${gitInfo.repo.ref ? "/tree/" + gitInfo.repo.ref : ""}`;
        case "gitgud": return `https://gitgud.io/${gitInfo.repo.owner}/${gitInfo.repo.name}`;
    }
}