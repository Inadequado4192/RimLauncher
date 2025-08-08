import { Modal } from "@mui/joy";
import React, { Suspense } from "react";
import GitModsDialog from "./Dialog";
import useGitModsNotify from "./Notify";
import LoadingForModal from "@Components/LoadingForModal";


export default function GitModsModal(props: {
    open: boolean,
    onClose: () => void,
    gitModsDialogParams: ReturnType<typeof useGitModsNotify>["params"]
}) {
    return (
        <Suspense fallback={<LoadingForModal />}>
            <Modal open={props.open} onClose={props.onClose}>
                <Dialog list={props.gitModsDialogParams} />
            </Modal>
        </Suspense>
    )
}

const Dialog = React.lazy(() => import("./Dialog"));
