import { ipc } from "#features/base/renderer";
import { useEffect, useState } from "react"
import { GitInfo, GitIpc } from "../../shared";
import { useGitMods } from "./useGitMods";
import { fail, ok, Result } from "#features/base/shared";

export function useGitModsUpdates() {
    const [hasUpdateSha, setHasUpdateSha] = useState<Result<string[], string>>();
    const gitMods = useGitMods();

    useEffect(() => {
        ipc.invoke(GitIpc.CheckUpdates,
            gitMods.reduce((list, m) => m.data.gitInfo.ok ? [...list, m.data.gitInfo.data] : list, [] as GitInfo[])
        )
            .then(r => setHasUpdateSha(ok(r.hasUpdateSha)))
            .catch(e => setHasUpdateSha(fail(String(e))));
    }, [gitMods]);

    return hasUpdateSha;
}