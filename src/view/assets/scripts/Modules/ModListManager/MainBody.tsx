import { Stack } from "@mui/joy";
import ModList from "./ModList";
import ModInfo from "./ModInfo";
import React from "react";
import ModListActions from "./ModListActions";
import { z } from "zod";
import { GameInfoContext } from "@Context/GameInfoContext";

export default function MainBody() {
    const value = MainBodyContextData();

    return (
        <Stack
            direction="row"
            flex={1}
            gap={2}
            overflow="hidden"
            sx={{
                p: 1
            }}
        >
            <MainBody.Context.Provider value={value}>
                <ModList />
                <ModListActions />
                <ModInfo />
            </MainBody.Context.Provider>
        </Stack>
    )
}

MainBody.Context = React.createContext<MainBodyContext>(null as any);
export type MainBodyContext = ReturnType<typeof MainBodyContextData>;


// interface ProblemGroup {
//     name: string,
//     type: "Error" | "Warning" | "Bug",
//     title: string,
//     problems: Problem[],
// }
// type Problem = {
//     mods: ModInfo[],
//     message: string,
// }


// interface ProblemGroup_MissingMods extends ProblemGroup {
//     name: "MissingMods",
//     type: "Warning",
//     title: string,
//     problems: Problem[],
// }


function MainBodyContextData() {
    const { gameInfo } = React.useContext(GameInfoContext);
    const [selectedMod, setSelectedMod] = React.useState<ModInfo>();
    const [problems, setProblems] = React.useState<{
        missingMods: PackageId[],
        modListErrors: ModListErrorReport[],
        wrongVersion: ModInfo[],
        missingModVersion: ModInfo[],
    }>();

    const [modList, setModList] = React.useState<ModInfo[]>();
    const [activeMods, setActiveModsIds] = React.useState<PackageId[]>();
    const [isPending, setIsPending] = React.useState(true);


    function proccesData_List(res: Awaited<ReturnType<typeof invoke.getModList>>) {
        if (res.success) {
            if (res.warnings.length) console.warn(res.warnings);
            setModList(res.data);
        } else {
            setModList([]);
        }
    }

    React.useEffect(() => {
        // First Load
        Promise.all([
            invoke.getModsConfig().then(res => setActiveModsIds(res.activeMods.li ?? [])),
            invoke.getModList().then(proccesData_List)
        ]).finally(() => {
            setIsPending(false)
        });


        // Watch
        function onChange(e: Electron.IpcRendererEvent, data: Parameters<Parameters<typeof on<"changeModsConfigFile">>[1]>[1]) {
            if ("errors" in data) return;
            invoke.getModsConfig().then(res => setActiveModsIds(res.activeMods.li ?? []));
        }
        on("changeModsConfigFile", onChange);
        return () => {
            off("changeModsConfigFile", onChange);
        }
    }, []);



    const sortedMods = React.useMemo(() => {
        if (!modList || !activeMods || !gameInfo) return;

        const _problems: typeof problems & {} = {
            missingMods: [],
            modListErrors: [],
            wrongVersion: [],
            missingModVersion: [],
        }
        const
            actives: ModInfo[] = [],
            unactives: ModInfo[] = [...modList]; // .filter(a => a.about.packageId !== "brrainz.harmony" as any)


        for (const mod of modList) {
            if (mod.about.supportedVersions) {
                if (!mod.about.supportedVersions.includes(gameInfo.gameVersionShort)) {
                    _problems.wrongVersion.push(mod);
                }
            } else _problems.missingModVersion.push(mod);
        }

        for (const packageId of activeMods) {
            let modi = unactives.findIndex(mod => mod.about.packageId == packageId)

            if (modi >= 0) {
                actives.push(unactives[modi]!);
                unactives.splice(modi, 1);
            } else _problems.missingMods.push(packageId);
        }

        function addModListError<K extends keyof ModListErrorReport["errors"]>(mod: ModInfo, key: K, val: (ModListErrorReport["errors"][K] & {})[number]) {
            let o = _problems.modListErrors.find(o => o.mod.about.packageId == mod.about.packageId);
            if (!o) _problems.modListErrors.push(o = { mod, errors: {} });
            if (!o.errors[key]) o.errors[key] = [];
            o.errors[key].push(val as any);
        }

        for (let i = 0; i < actives.length; i++) {
            const mod = actives[i]!;
            
            mod.about.loadAfter?.forEach(pid => {
                for (let j = i + 1; j < actives.length; j++) {
                    if (actives[j]!.about.packageId == pid) {
                        addModListError(mod, "loadAfter", actives[j]!);
                        return;
                    }
                }
            });
            mod.about.loadBefore?.forEach(pid => {
                for (let j = 0; j < i; j++) {
                    if (actives[j]!.about.packageId == pid) {
                        addModListError(mod, "loadBefore", actives[j]!);
                        return;
                    }
                }
            });
            mod.about.incompatibleWith?.forEach(pid => {
                for (let j = 0; j < actives.length; j++) {
                    if (actives[j]!.about.packageId == pid) {
                        addModListError(mod, "incompatibleWith", actives[j]!);
                        return;
                    }
                }
            });
            // mod.about.modDependencies?.forEach(dep => {
            //     for (let j = 0; j < actives.length; j++) {
            //         if (actives[j]!.about.packageId == dep.packageId.toLowerCase()) {
            //             if (j >= i + 1 &&
            //                 !(reports.find(rep => rep.mod == mod)?.errors.loadAfter?.includes(actives[j]!))
            //             ) addModListError(mod, "loadAfter", actives[j]!);
            //             return;
            //         }
            //     }
            //     let uaMod = unactives.find(uaMod => uaMod.about.packageId == dep.packageId.toLowerCase());
            //     addModListError(mod, "modDependencies", uaMod ?? dep);
            // });
            mod.about.modDependencies?.forEach(dep => {
                for (let j = 0; j < actives.length; j++)
                    if (actives[j]!.about.packageId == dep.packageId)
                        return;
                let uaMod = unactives.find(uaMod => uaMod.about.packageId == dep.packageId);
                addModListError(mod, "modDependencies", uaMod ?? dep);
            });
        }


        setProblems(_problems);

        return { actives, unactives };
    }, [activeMods, modList, gameInfo]);

    return {
        selectedMod, setSelectedMod,
        problems,
        // modList,
        activeMods,
        sortedMods,
        isPending,
    }
}