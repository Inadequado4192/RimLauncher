import { Modal } from "@mui/joy";
import React from "react";

export default function UserConfigWindowModal(props: { open: boolean, onClose: () => void }) {
    return (
        <Modal open={props.open} onClose={props.onClose}>
            <UserConfigWindowDialogLazy />
        </Modal>
    )
}

const UserConfigWindowDialogLazy = React.lazy(() => import("./UserConfigWindowDialog"));