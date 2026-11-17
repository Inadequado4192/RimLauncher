import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { List, ListItem, ListItemButton, ListItemDecorator, Typography, Box } from "@mui/joy";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Virtuoso } from "react-virtuoso";
import { NodeId, TreeNodeBase, TreeProps } from "./types";

interface Row<N> {
    node: N;
    depth: number;
    hasChildren: boolean;
}

/** Рекурсивно сортує та будує індекси один раз для nodes */
function buildModel<N extends TreeNodeBase<N>>(nodes: N[], sort?: (a: N, b: N) => number) {
    const byId = new Map<NodeId, N>();
    const sorted = new Map<NodeId, N[]>();        // id -> відсортовані діти ("" для кореня)

    const visit = (list: N[], parent: NodeId) => {
        const copy = sort ? [...list].sort(sort) : list;
        sorted.set(parent, copy);
        for (const n of copy) {
            byId.set(n.id, n);
            if (n.children?.length) visit(n.children, n.id);
        }
    };
    visit(nodes, "");
    return { byId, sorted };
}

interface TreeRowProps {
    id: NodeId;
    depth: number;
    label: ReactNode;
    icon: ReactNode;
    end: ReactNode;
    hasChildren: boolean;
    expanded: boolean;
    selected: boolean;
    selectable: boolean;
    onToggle: (id: NodeId) => void;
    onSelect: (id: NodeId, e: React.MouseEvent) => void;
}

const TreeRow = memo(function TreeRow(p: TreeRowProps) {
    return (
        <ListItem>
            <ListItemButton
                selected={p.selected}
                disabled={false}
                onClick={(e) => (p.selectable ? p.onSelect(p.id, e) : p.hasChildren && p.onToggle(p.id))}
                sx={{
                    pl: 0.5 + p.depth * 2,
                    py: 0.25,
                    gap: 0.5,
                    cursor: "pointer"
                }}
            >
                <Box
                    onClick={(e) => { e.stopPropagation(); if (p.hasChildren) p.onToggle(p.id); }}
                    sx={{ width: 20, display: "flex", justifyContent: "center", visibility: p.hasChildren ? "visible" : "hidden" }}
                >
                    <ChevronRightIcon
                        fontSize="small"
                        sx={{ transition: "transform .15s", transform: p.expanded ? "rotate(90deg)" : "none" }}
                    />
                </Box>
                {p.icon && <ListItemDecorator sx={{ minInlineSize: 0, mr: 0.5 }}>{p.icon}</ListItemDecorator>}
                <Typography level="body-sm" noWrap sx={{ flex: 1, opacity: p.selectable ? 1 : 0.8 }}>{p.label}</Typography>
                {p.end}
            </ListItemButton>
        </ListItem>
    );
});

export function Tree<N extends TreeNodeBase<N>>(props: TreeProps<N>) {
    const { nodes, getLabel, getIcon, isSelectable, sort, defaultExpanded, renderEnd, virtualized, height = 320 } = props;

    const model = useMemo(() => buildModel(nodes, sort), [nodes, sort]);
    const [expanded, setExpanded] = useState<Set<NodeId>>(() => new Set(defaultExpanded));

    // плоский список видимих рядків
    const rows = useMemo(() => {
        const out: Row<N>[] = [];
        const walk = (parent: NodeId, depth: number) => {
            for (const node of model.sorted.get(parent) ?? []) {
                const hasChildren = !!node.children?.length;
                out.push({ node, depth, hasChildren });
                if (hasChildren && expanded.has(node.id)) walk(node.id, depth + 1);
            }
        };
        walk("", 0);
        return out;
    }, [model, expanded]);

    const onToggle = useCallback((id: NodeId) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    // props.onChange і value читаємо через ref-подібне замикання: колбек оновлюється лише при їх зміні
    const { selectionMode, value, onChange } = props;
    const onSelect = useCallback((id: NodeId, _: React.MouseEvent) => {
        const node = model.byId.get(id) ?? null;
        if (selectionMode === "single") {
            onChange(value === id ? null : id, value === id ? null : node);
        } else if (selectionMode === "multiple") {
            const next = new Set(value as ReadonlySet<NodeId>);
            next.has(id) ? next.delete(id) : next.add(id);
            onChange(next);
        }
    }, [model, selectionMode, value, onChange]);

    const isSelected = (id: NodeId) =>
        selectionMode === "single" ? value === id
            : selectionMode === "multiple" ? (value as ReadonlySet<NodeId>).has(id)
                : false;

    const renderRow = (r: Row<N>) => (
        <TreeRow
            key={r.node.id}
            id={r.node.id}
            depth={r.depth}
            label={getLabel(r.node)}
            icon={getIcon?.(r.node, expanded.has(r.node.id))}
            end={renderEnd?.(r.node)}
            hasChildren={r.hasChildren}
            expanded={expanded.has(r.node.id)}
            selected={isSelected(r.node.id)}
            selectable={selectionMode !== undefined && selectionMode !== "none" && (isSelectable?.(r.node) ?? true)}
            onToggle={onToggle}
            onSelect={onSelect}
        />
    );

    return (
        <List size="sm" sx={{ "--ListItem-minHeight": "26px", p: 0, overflow: "auto", maxHeight: virtualized ? undefined : height }}>
            {virtualized ? (
                <Virtuoso
                    style={{ height: typeof height === "number" ? height : undefined }}
                    data={rows}
                    computeItemKey={(_, r) => r.node.id}
                    itemContent={(_, r) => renderRow(r)}
                />
            ) : (
                rows.map(renderRow)
            )}
        </List>
    );
}