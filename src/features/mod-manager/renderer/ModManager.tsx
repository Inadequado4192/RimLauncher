import "./index.css";
import { Stack } from "@mui/joy";
import { MiddleBlock, ModLists, ModInfo } from "./components";
import { useModLoader } from "#features/mod-core/renderer";

export function ModManager() {
    useModLoader();
    return (
        <Stack
            direction="row"
            gap={2}
            height="100%"
            sx={{
                "& > :nth-of-type(1)": { flex: 2 },
                "& > :nth-of-type(2)": { flex: 1 },
                "& > :nth-of-type(3)": { flex: 2 }
            }}
        >
            <ModLists />
            <MiddleBlock />
            <ModInfo />
        </Stack>
    )
}
