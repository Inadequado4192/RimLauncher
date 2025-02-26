import { Modal } from "@mui/material";
import React from "react";


export default function MyltiplayerCompabilityModal(props: { open: boolean, onClose: () => void }) {
    return (
        <Modal open={props.open} onClose={props.onClose}>
            <MyltiplayerCopabilityDialogLazy />
        </Modal>
    )
}

const MyltiplayerCopabilityDialogLazy = React.lazy(() => import("./MyltiplayerCompabilityDialog"));
