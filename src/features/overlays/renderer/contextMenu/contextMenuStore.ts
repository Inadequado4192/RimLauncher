import { create } from "zustand";
import { ReactNode } from "react";

export interface ContextMenuItem {
    id: string;
    label: ReactNode;
    icon?: ReactNode;
    color?: "neutral" | "danger" | "primary";
    disabled?: boolean;
    run: () => unknown;
}

export type ContextMenuEntry = ContextMenuItem | "divider";

interface ContextMenuState {
    x: number;
    y: number;
    entries: ContextMenuEntry[];
}

export const useContextMenu = create<{ state: ContextMenuState | null }>()(() => ({ state: null }));

export function openContextMenu(e: { clientX: number; clientY: number; preventDefault(): void }, entries: ContextMenuEntry[]) {
    e.preventDefault();
    if (!entries.length) return;
    useContextMenu.setState({ state: { x: e.clientX, y: e.clientY, entries } });
}

export const closeContextMenu = () => useContextMenu.setState({ state: null });