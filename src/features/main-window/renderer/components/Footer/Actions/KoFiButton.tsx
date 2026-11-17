import { openUrl } from "#features/system/renderer";
import { Button } from "@mui/joy";

export function KoFiButton() {
    return (
        <Button
            startDecorator={<img src="https://storage.ko-fi.com/cdn/cup-border.png" height={20} width={20} />}
            color="success"
            onClick={() => openUrl("https://ko-fi.com/C0C01KFX3A")}
        >
            Support Me
        </Button>
    )
}