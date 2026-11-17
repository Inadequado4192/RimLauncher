import { ComponentType } from "react";
import { LocalKey } from "#features/localization/shared";
import { useLocalize } from "#features/localization/renderer";
import { IconButton, Tooltip } from "@mui/joy";
import { ModEntry } from "../shared";

export interface ModAction {
    id: string;
    order: number;
    when(mod: ModEntry): boolean;
    Component: ComponentType<{ mod: ModEntry }>;
}

const actions = new Map<string, ModAction>();

export function registerModAction(a: ModAction) {
    if (actions.has(a.id)) throw new Error(`Mod action "${a.id}" is already registered`);
    actions.set(a.id, a);
}

export const getModActions = (mod: ModEntry): ModAction[] =>
    [...actions.values()]
        .filter((a) => a.when(mod))
        .sort((x, y) => x.order - y.order);

/** Фабрика для простих статичних кнопок */
export function simpleAction(o: {
    id: string;
    order: number;
    when: (m: ModEntry) => boolean;
    icon: ComponentType;
    label: LocalKey;
    color?: "primary" | "danger" | "neutral";
    run: (m: ModEntry) => unknown;
}): ModAction {
    function Button({ mod }: { mod: ModEntry }) {
        const t = useLocalize();
        return (
            <Tooltip title={t(o.label)}>
                <IconButton color={o.color ?? "neutral"} onClick={() => o.run(mod)}>
                    <o.icon />
                </IconButton>
            </Tooltip>
        );
    }
    return { id: o.id, order: o.order, when: o.when, Component: Button };
}