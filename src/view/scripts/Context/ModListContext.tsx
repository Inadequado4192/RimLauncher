import React from "react";
import { Mod as Mod, ModErrorType } from "../Classes/Mod";
import { UserConfigContext } from "./UserConfigContext";
import { ModsConfigContext } from "./ModsConfig";
import { GameInfoContext } from "./GameInfoContext";
import Localize from "@Common/Localize";
import { AlertBigService } from "@Services/AlertBig";
import { List, ListItem, ListItemButton, Typography, Stack } from "@mui/joy";

export const ModListContext = React.createContext<ReturnType<typeof useDate>>(null as any);

function useDate() {
    const { userConfig } = React.useContext(UserConfigContext);
    const { gameInfo } = React.useContext(GameInfoContext);
    const modsConfig = React.useContext(ModsConfigContext);

    const [mods, setMods] = React.useState<Mod[]>([]);
    const [isLoaded, setIsLoaded] = React.useState(false);

    const [modsString, setModsString] = React.useState("");

    const [warnings, setWarnings] = React.useState<Warning[]>([]);
    const alertBigRefId = React.useRef<number | null>(null);


    React.useEffect(() => {
        const str = mods.map(m => `${m.packageId}-${m.dirPath}`).join(",");
        if (modsString != str) setModsString(str);
    }, [mods]);


    React.useEffect(() => {
        if (alertBigRefId.current != undefined) AlertBigService.remove(alertBigRefId.current);
        if (warnings.length) {
            const { id } = AlertBigService.create({
                title: Localize("warnings"),
                text: (
                    <List>
                        {warnings.map((w, i) => (
                            <ListItem key={i}>
                                <ListItemButton
                                    title={w.dirPath}
                                    onClick={() => invoke.openPath(w.dirPath)}
                                >
                                    <Stack>
                                        <Typography>{w.message}</Typography>
                                        <Typography noWrap level="body-xs">{w.dirPath}</Typography>
                                    </Stack>
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                ),
            });
            alertBigRefId.current = id;
        }
    }, [warnings]);


    function updateMod(mod: Mod) {
        const ind = mods.indexOf(mod);
        if (ind == -1) throw Error("Unknown Mod");
        mods.splice(ind, 1, new Mod(mod));
    }
    function rerender() {
        setMods(mods => [...mods]);
    }


    React.useEffect(() => {
        // First Load
        invoke.getModList().then(async (res) => {
            if (res.success) {
                console.log(res);
                const newMods: Mod[] = [], newWarnings: Warning[] = [];
                res.data.forEach(d => {
                    if (d.warnings.length) console.log({ d });
                    if (d.about) newMods.push(new Mod(d));
                    newWarnings.push(...d.warnings);
                });
                setMods(newMods);
                setWarnings(newWarnings);
            } else {
                setMods([]);
                setWarnings([]);
            }
            setIsLoaded(true);
        });
    }, []);
    React.useEffect(() => {
        // Watch
        const onWorkshopContentChanged: on_listenerType<typeof on.WorkshopContentChanged> = (e, ...data) => {
            if (data[0] == "add") {
                const d = data[1];
                if (d.about) setMods(mods => [...mods, new Mod(d)]);
                else setWarnings(warnings => [...warnings, ...d.warnings])
            } else {
                const m_ind = mods.findIndex(m => m.dirPath == data[1]);
                if (m_ind >= 0) {
                    mods.splice(m_ind, 1);
                    setMods([...mods]);
                }

                const w_ind = warnings.findIndex(w => w.dirPath == data[1]);
                if (w_ind >= 0) {
                    warnings.splice(w_ind, 1);
                    setWarnings([...warnings]);
                }
            }
        }
        on.WorkshopContentChanged(onWorkshopContentChanged);
        return () => {
            off.WorkshopContentChanged(onWorkshopContentChanged);
        }
    }, [mods, warnings]);




    React.useEffect(() => {
        Mod.modsConfig = modsConfig;
        rerender();
    }, [modsConfig]);

    React.useEffect(() => {
        Mod.gameInfo = gameInfo;
        rerender();
    }, [gameInfo]);





    const { unactives, actives } = React.useMemo(() => {
        let unactives: Mod[] = [], actives: Mod[] = [];

        if (modsConfig) {
            unactives = mods.filter(m => !m.isActive());
            actives = mods.filter(m => m.isActive())
                .sort((a, b) => {
                    return modsConfig.activeMods.findIndex(p => a.samePackageId(p)) - modsConfig.activeMods.findIndex(p => b.samePackageId(p));
                });
        }

        return { unactives, actives };

    }, [mods, modsConfig?.activeMods]);



    const errorType = React.useMemo(() => {
        let prevE: ModErrorType = ModErrorType.None;
        for (const m of actives) {
            m.modListRef = { actives, unactives };
            const e = m.getErrorType();
            if (e == ModErrorType.Error) return e;
            else prevE = e;
        }
        return prevE;
    }, [actives, modsConfig]);


    React.useEffect(() => {
        if (!userConfig) return;
        let needUpdate = false;
        mods.forEach(m => {
            const tags = userConfig.tags.filter(tag => tag.packageIds.find(id => m.samePackageId(id)));
            if (JSON.stringify(m.tags) !== JSON.stringify(tags)) {
                m.tags = tags;
                updateMod(m);
                needUpdate = true;
            }
        });
        if (needUpdate) rerender();
    }, [modsString, userConfig?.tags]);


    return { mods, actives, unactives, errorType, isLoaded };
}

export function ModListContextProvider({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    return (
        <ModListContext.Provider value={useDate()}>{children}</ModListContext.Provider>
    )
}