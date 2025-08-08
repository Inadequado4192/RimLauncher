import { Modal } from "@mui/joy";
import React from "react";


export default function ModPackListWindowModal(props: { open: boolean, onClose: () => void }) {
    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Dialog />
        </Modal>
    )
}

const Dialog = React.lazy(() => import("./ModPackListWindowDialog"));
