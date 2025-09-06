import { Modal } from "@mui/joy";
import React, { Suspense } from "react";
import useGitModsNotify from "./Notify";
import FullscreanLoading from "@Components/LoadingForModal";


export default function GitModsModal(props: {
    open: boolean,
    onClose: () => void,
    gitModsDialogParams: ReturnType<typeof useGitModsNotify>["params"]
}) {
    return (
        <Suspense fallback={<FullscreanLoading />}>
            <Modal open={props.open} onClose={props.onClose}>
                <Dialog list={props.gitModsDialogParams} />
            </Modal>
        </Suspense>
    )
}

const Dialog = React.lazy(() => import("./Dialog"));
