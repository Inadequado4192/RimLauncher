import { Modal } from "@mui/joy";
import { createContext, useContext } from "react";
import { useDialogs } from "./dialogStore";

const DialogCloseContext = createContext<(result?: unknown) => void>(() => { });
export const useDialogClose = () => useContext(DialogCloseContext);

export function DialogHost() {
    const items = useDialogs((s) => s.items);
    return (
        <>
            {items.map((d) => (
                <Modal key={d.id} open={d.open} onClose={() => d.dismissable && d.close()}>
                    <DialogCloseContext.Provider value={d.close}>
                        {d.body}
                    </DialogCloseContext.Provider>
                </Modal>
            ))}
        </>
    );
}