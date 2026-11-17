import { ReactNode } from "react";
import { create } from "zustand";

interface TooltipState {
    anchorEl: HTMLElement;
    content: ReactNode;
}

export const useTooltip = create<{ state: TooltipState | null }>()(() => ({ state: null }));

let hideTimer: ReturnType<typeof setTimeout> | undefined;
export function cancelHideTooltip() {
    clearTimeout(hideTimer);
}

export const showTooltip = (anchorEl: HTMLElement, content: ReactNode) =>
    useTooltip.setState({ state: { anchorEl, content } });

export function hideTooltip(delay = 100) {
    cancelHideTooltip();
    hideTimer = setTimeout(() => useTooltip.setState({ state: null }), delay);
}