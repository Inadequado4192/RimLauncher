import { Mod_Git } from "@Classes/Mod";
import { ModListStore } from "@Context/ModListContext";
import { StoreCompares } from "@Stores/store";
import React from "react";

type NotifyParams = { mod: Mod_Git, canBeUpdate: boolean }[];

export function useGitMods() {
    return ModListStore.mods.use(
        ml => Object.values(ml).filter(m => m.isGit()),
        (p, n) => StoreCompares.isEqualAtArray(p, n, (prev_mod, next_mod) => prev_mod.dirPath === next_mod.dirPath)
    );
}

export default function useGitModsNotify() {
    const gitMods = useGitMods();

    const [checkUpdatesList, setCheckUpdatesList] = React.useState<NotifyParams>();

    React.useMemo(() => {
        (async () => {
            let promises: Promise<{ mod: Mod_Git, data: GitInfoRequest_GitGud_api_graphql }>[] = []
            for (const mod of gitMods) {
                if (!mod.gitrepo) continue;
                const json = fetch("https://gitgud.io/api/graphql", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        query: "query pathLastCommit($projectPath: ID!, $path: String, $ref: String!, $refType: RefType) {\n  project(fullPath: $projectPath) {\n    id\n    repository {\n      lastCommit(path: $path, ref: $ref, refType: $refType) {\n        id\n        sha\n        title\n        titleHtml\n        descriptionHtml\n        message\n        webPath\n        committerName\n        committedDate\n        authorName\n      }\n    }\n  }\n}",
                        variables: {
                            "path": "",
                            "projectPath": `${mod.gitrepo.info.user}/${mod.gitrepo.info.repo}`,
                            "ref": mod.gitrepo.info.tree,
                            "refType": "HEADS"
                        }
                    })
                }).then(async res => ({
                    mod, data: (await res.json()) as GitInfoRequest_GitGud_api_graphql
                }));

                promises.push(json);
            }

            const res = await Promise.all(promises);
            setCheckUpdatesList(res.map(r => {
                return {
                    mod: r.mod,
                    canBeUpdate: new Date(r.data.data.project.repository.lastCommit.committedDate).getTime() > r.mod.gitinfo!.lastUpdate
                }
            }))
        })();
    }, [gitMods]);

    return {
        count: checkUpdatesList?.filter(d => d.canBeUpdate).length ?? 0,
        params: checkUpdatesList
    }
}