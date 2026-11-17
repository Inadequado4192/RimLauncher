import { ModEntry } from "../shared";
import { SvgIconComponent } from "@mui/icons-material";

export interface ModTypeView {
    id: string;
    icon: SvgIconComponent;
    sourceUrl?(mod: ModEntry): string | null;
}

export const registeredMods = new Map<string, ModTypeView>();

export function registerModType(view: ModTypeView) {
    if (registeredMods.has(view.id)) throw new Error(`ModBaseData type "${view.id}" is already registered`);
    registeredMods.set(view.id, view);
}

export const getModIcon = (mod: ModEntry) =>
    registeredMods.get(mod.type)?.icon ?? (() => { throw Error("Unknown Mod Type") })();

export const getModSourceUrl = (mod: ModEntry): string | undefined =>
    registeredMods.get(mod.type)?.sourceUrl?.(mod) ?? mod.about.url ?? undefined;
