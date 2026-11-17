import { registerModAction, registerModType, simpleAction } from "#features/mod-type/renderer";
import { openUrl } from "#features/system/renderer";
import { GitModType } from "../shared";
import { GithubIcon } from "./GithubIcon";
import { getRepoUrl } from "./gitUtils";

export function initGit() {
    registerModType({
        id: GitModType.id,
        icon: GithubIcon,
        sourceUrl: m => {
            if (GitModType.is(m) && m.data.gitInfo.ok) return getRepoUrl(m.data.gitInfo.data);
            return null;
        },
    });

    registerModAction(simpleAction({
        id: "open-in-git",
        order: 50,
        when: m => GitModType.is(m) && m.data.gitInfo.ok,
        icon: GithubIcon,
        label: "git.openInGit",
        run: m => {
            if (GitModType.is(m) && m.data.gitInfo.ok) openUrl(getRepoUrl(m.data.gitInfo.data));
        },
    }));
}
