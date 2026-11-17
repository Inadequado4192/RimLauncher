import { disableMod, enableMod, openModDir, openMudSource, registerModAction, registerModType, simpleAction } from "#features/mod-type/renderer";
import { LocalModType, OfficialModType } from "../shared";
import FolderIcon from "@mui/icons-material/Folder";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import LinkIcon from "@mui/icons-material/Link";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { useDerivedMods } from "./store";
import { useCallback } from "react";
import { IconButton } from "@mui/joy";


export function initModCore() {
    registerModType({
        id: OfficialModType.id,
        icon: StarRoundedIcon
    });

    registerModType({
        id: LocalModType.id,
        icon: FolderIcon
    });


    registerModAction({
        id: "toggle",
        order: 0,
        when: () => true,
        Component: ({ mod }) => {
            const isActive = useDerivedMods(s => s.enabledMods.includes(mod));
            const handleToggle = useCallback(() => {
                if (isActive) disableMod(mod);
                else enableMod(mod);
            }, [isActive, mod])

            return (
                <IconButton color={isActive ? "success" : "neutral"} onClick={handleToggle}>
                    <PowerSettingsNewIcon />
                </IconButton>
            );
        }
    });


    registerModAction(simpleAction({
        id: "open-dir",
        order: 25,
        when: () => true,
        icon: FolderIcon,
        label: "mods.actions.openDirectory",
        run: (m) => openModDir(m),
    }));

    registerModAction(simpleAction({
        id: "open-source",
        order: 50,
        when: () => true,
        icon: LinkIcon,
        label: "mods.actions.openSource",
        run: (m) => openMudSource(m),
    }));

}