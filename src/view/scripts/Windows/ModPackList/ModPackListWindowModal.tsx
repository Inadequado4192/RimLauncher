import { Modal } from "@mui/joy";
import FullscreanLoading from "@Renderer/scripts/Components/LoadingForModal";
import React from "react";


export default function ModPackListWindowModal(props: { open: boolean, onClose: () => void }) {
    return (
        <React.Suspense fallback={<FullscreanLoading />}>
            <Modal open={props.open} onClose={props.onClose}>
                <Dialog />
            </Modal>
        </React.Suspense>
    )
}

const Dialog = React.lazy(() => import("./ModPackListWindowDialog"));
