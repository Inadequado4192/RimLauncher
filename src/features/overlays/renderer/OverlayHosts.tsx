import { ContextMenuHost } from "./contextMenu";
import { DialogHost } from "./dialogs";
import { DrawerHost } from "./drawer";
import { TaskHost } from "./tasks";
import { TooltipHost } from "./tooltips";

export function OverlayHosts() {
    return (
        <>
            <DialogHost />
            <TooltipHost />
            <DrawerHost />
            <ContextMenuHost />
            <TaskHost />
        </>
    )
}