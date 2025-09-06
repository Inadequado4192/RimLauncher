import { Modal } from "@mui/joy";
import React from "react";
import FullscreanLoading from "../Components/LoadingForModal";

export default function UserConfigWindowModal(props: { open: boolean, onClose: () => void }) {
    return (
        <React.Suspense fallback={<FullscreanLoading />}>
            <Modal open={props.open} onClose={props.onClose}>
                <Dialog />
            </Modal>
        </React.Suspense>
    )
}

const Dialog = React.lazy(() => import("./UserConfigWindowDialog"));