import { ipc } from "#features/base/renderer";
import { createElement, ReactNode } from "react";
import ExtensionIcon from "@mui/icons-material/Extension";
import { SvgIcon } from "@mui/joy";
import { PackageIdLower } from "#features/app/shared";
import { ModsConfigIpc } from "#features/mods-config/shared";
import { SystemIpc } from "#features/system/shared";
import { openUrl } from "#features/system/renderer";
import { ModEntry } from "../shared";
import { toModFileUrl } from "#features/mod-core/shared";

export function getModSelfIcon(m: ModEntry): ReactNode {
    if (!m.iconPath) return createElement(ExtensionIcon);
    return createElement(
        SvgIcon,
        {
            children: createElement("image", { href: toModFileUrl(m.iconPath), width: "100%", height: "100%" })
        }
    );
}

export const enableMod = (m: ModEntry) => ipc.invoke(ModsConfigIpc.EnableMods, [m.about.packageId]);
export const enableModAfter = (m: ModEntry, afterPackageId: PackageIdLower) => ipc.invoke(ModsConfigIpc.EnableModAfter, m.about.packageId, afterPackageId);
export const enableModBefore = (m: ModEntry, beforePackageId: PackageIdLower) => ipc.invoke(ModsConfigIpc.EnableModBefore, m.about.packageId, beforePackageId);
export const disableMod = (m: ModEntry) => ipc.invoke(ModsConfigIpc.DisableMods, [m.about.packageId]);

export const openModDir = (m: ModEntry) => ipc.invoke(SystemIpc.OpenPath, (m.dirPath));
export const openMudSource = (m: ModEntry) => void (m.about.url && openUrl(m.about.url));