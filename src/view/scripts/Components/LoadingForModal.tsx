import { CircularProgress, Modal } from "@mui/joy";

export default function LoadingForModal() {
    return (
        <Modal open sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none"
        }}>
            <CircularProgress />
        </Modal>
    )
}