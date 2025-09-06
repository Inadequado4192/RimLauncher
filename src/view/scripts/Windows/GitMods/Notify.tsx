import { Mod_Git } from "@Classes/Mod";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import { StoreCompares } from "@Stores/store";
import React from "react";

type NotifyParams = { mod: Mod_Git, canBeUpdate: boolean };

export function useGitMods() {
    return __GlobalStores__.mods.use(
        ml => Object.values(ml).filter(m => m.isGit()),
        (p, n) => StoreCompares.isEqualAtArray(p, n, (prev_mod, next_mod) => prev_mod.dirPath === next_mod.dirPath)
    );
}

export default function useGitModsNotify() {
    const gitMods = useGitMods();

    const [checkUpdatesList, setCheckUpdatesList] = React.useState<NotifyParams[]>();

    React.useEffect(() => {
        let promises: Promise<NotifyParams>[] = []
        for (const mod of gitMods) {
            promises.push(new Promise(async (t, f) => {
                try {
                    t({
                        mod,
                        canBeUpdate: await mod.canBeUpdateGit(),
                    })
                } catch (e) { f(e); }
            }))
        }

        Promise.all(promises).then(setCheckUpdatesList);
    }, [gitMods]);

    return {
        count: checkUpdatesList?.filter(d => d.canBeUpdate).length ?? 0,
        params: checkUpdatesList
    }
}