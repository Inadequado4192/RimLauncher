import { ipc } from "#features/base/renderer";
import { useEffect, useState } from "react"
import { GitInfo, GitIpc } from "../../shared";
import { useGitMods } from "./useGitMods";
import { createBackgroundTask } from "#features/overlays/renderer";

export function useGitModsUpdates() {
    const [hasUpdateSha, setHasUpdateSha] = useState<string[]>([]);
    const gitMods = useGitMods();

    useEffect(() => {
        ipc.invoke(GitIpc.CheckUpdates,
            gitMods.reduce((list, m) => m.data.gitInfo.ok ? [...list, m.data.gitInfo.data] : list, [] as GitInfo[])
        )
            .then(r => setHasUpdateSha(r.hasUpdateSha))
            .catch(createBackgroundTask.error.bind({}, "Git Mods Updates"));
    }, [gitMods]);

    return { hasUpdateSha };
}