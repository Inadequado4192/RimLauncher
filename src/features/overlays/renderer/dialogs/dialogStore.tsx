import { ReactNode } from "react";
import { create } from "zustand";

interface DialogItem {
    id: string;
    open: boolean;
    body: ReactNode;
    dismissable: boolean;
    close: (result?: unknown) => void;
}

export const useDialogs = create<{ items: DialogItem[] }>()(() => ({ items: [] }));





export function createDialog<T = void>(
    body: ReactNode | ((close: (result: T) => void) => ReactNode),
    opts: { dismissable?: boolean } = {},
): Promise<T | undefined> {
    return new Promise((resolve) => {
        const id = crypto.randomUUID();

        const close = (result?: unknown) => {
            useDialogs.setState((s) => ({
                items: s.items.map((i) => (i.id === id ? { ...i, open: false } : i)),
            }));
            resolve(result as T);
            setTimeout(() => {
                useDialogs.setState((s) => ({ items: s.items.filter((i) => i.id !== id) }));
            }, 300);
        };

        const node = typeof body === "function" ? body(close) : body;
        useDialogs.setState((s) => ({
            items: [...s.items, { id, open: true, body: node, dismissable: opts.dismissable ?? true, close }],
        }));
    });
}

