import { Divider, ListItemDecorator, Menu, MenuItem } from "@mui/joy";
import { useEffect, useMemo } from "react";
import { closeContextMenu, useContextMenu } from "./contextMenuStore";

export function ContextMenuHost() {
    const state = useContextMenu((s) => s.state);

    const anchor = useMemo(() => state && ({
        getBoundingClientRect: () => DOMRect.fromRect({ x: state.x, y: state.y, width: 0, height: 0 }),
    }), [state]);

    useEffect(() => {
        if (!state) return;
        const close = () => closeContextMenu();
        const onDown = (e: PointerEvent) => {
            if (!(e.target as HTMLElement).closest("[role=menu]")) closeContextMenu();
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeContextMenu();


        addEventListener("pointerdown", onDown, true);
        addEventListener("keydown", onKey, true);
        addEventListener("resize", close);
        addEventListener("blur", close);
        addEventListener("wheel", close, { passive: true });
        return () => {
            removeEventListener("resize", close);
            removeEventListener("blur", close);
            removeEventListener("wheel", close);
            removeEventListener("pointerdown", onDown, true);
            removeEventListener("keydown", onKey, true);
        };
    }, [state]);

    useEffect(() => closeContextMenu, []);

    if (!state || !anchor) return null;

    return (
        <Menu
            open
            anchorEl={anchor as any}
            placement="bottom-start"
            onClose={() => {
                // dont work :)
                closeContextMenu();
            }}
            size="sm"
            sx={{ zIndex: 2000, minWidth: 180 }}
        >
            {state.entries.map((entry, i) =>
                entry === "divider" ? (
                    <Divider key={`d${i}`} />
                ) : (
                    <MenuItem
                        key={entry.id}
                        color={entry.color}
                        disabled={entry.disabled}
                        onClick={() => { closeContextMenu(); void entry.run(); }}
                    >
                        {entry.icon && <ListItemDecorator>{entry.icon}</ListItemDecorator>}
                        {entry.label}
                    </MenuItem>
                ),
            )}
        </Menu>
    );
}