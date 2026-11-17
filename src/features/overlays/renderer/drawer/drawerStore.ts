import { ReactNode } from "react";
import { create } from "zustand";

export interface DrawerProps {
    id: string;
    open: boolean;
    body: ReactNode;
    close: (result?: unknown) => void;
    anchor: "left" | "top" | "right" | "bottom"
}

export const useDrawer = create<{ items: DrawerProps[] }>()(() => ({ items: [] }));





export function createDrawer<T = void>(props: Omit<DrawerProps, "id" | "open" | "close">): Promise<T | undefined> {
    return new Promise((resolve) => {
        const id = crypto.randomUUID();

        const close = (result?: unknown) => {
            useDrawer.setState((s) => ({
                items: s.items.map((i) => (i.id === id ? { ...i, open: false } : i)),
            }));
            resolve(result as T);
            setTimeout(() => {
                useDrawer.setState((s) => ({ items: s.items.filter((i) => i.id !== id) }));
            }, 300);
        };

        useDrawer.setState((s) => ({
            items: [
                ...s.items,
                { id, open: true, close, ...props }],
        }));
    });
}

