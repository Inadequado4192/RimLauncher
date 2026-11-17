import { Drawer } from "@mui/joy";
import { useDrawer } from "./drawerStore";

export function DrawerHost() {
    const items = useDrawer((s) => s.items);

    return (
        <>
            {items.map((d) => (
                <Drawer
                    key={d.id}
                    open={d.open}
                    onClose={() => d.close()}
                    anchor={d.anchor}
                    size="sm"
                    
                >
                    {d.body}
                </Drawer>
            ))}
        </>
    );
}