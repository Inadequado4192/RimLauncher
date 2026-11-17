import { ReactNode } from "react";

export type NodeId = string;

export interface TreeNodeBase<N> {
    id: NodeId;
    children?: N[];
}

interface CommonProps<N extends TreeNodeBase<N>> {
    nodes: N[];
    getLabel: (node: N) => ReactNode;
    getIcon?: (node: N, expanded: boolean) => ReactNode;
    isSelectable?: (node: N) => boolean;
    /** Порівняння для сортування братніх вузлів */
    sort?: (a: N, b: N) => number;
    /** Початково розкриті id */
    defaultExpanded?: Iterable<NodeId>;
    /** Заголовок над рядком, наприклад розмір файлу праворуч */
    renderEnd?: (node: N) => ReactNode;
    virtualized?: boolean;
    height?: number | string;
}

export type TreeProps<N extends TreeNodeBase<N>> =
    | (CommonProps<N> & {
        selectionMode: "single";
        value: NodeId | null;
        onChange: (id: NodeId | null, node: N | null) => void;
    })
    | (CommonProps<N> & {
        selectionMode: "multiple";
        value: ReadonlySet<NodeId>;
        onChange: (ids: Set<NodeId>) => void;
    })
    | (CommonProps<N> & {
        selectionMode?: "none";
        value?: undefined;
        onChange?: undefined;
    });