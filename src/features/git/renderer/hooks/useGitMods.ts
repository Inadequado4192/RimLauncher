import { GitMod, GitModType } from "#features/git/shared";
import { useModList } from "#features/mod-core/renderer";
import { useShallow } from "zustand/shallow";

export function useGitMods(): GitMod[] {
    return useModList(useShallow(s => (s.mods ?? []).filter(GitModType.is)));
}
export function getGitMods(): GitMod[] {
    return (useModList.getState().mods ?? []).filter(GitModType.is);
}