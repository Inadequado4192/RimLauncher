import "./index.css";
import { Stack } from "@mui/joy";
import ModList from "./ModList";
import ModInfo from "./ModInfo";
import Actions from "./Actions";
import { TagsVisibilityContextProvider } from "./Context/TagsVisibilityContext";
import { LocalModListContextProvider } from "./Context/LocalModListContext";

export default function ModListManager() {
    return (
        <Stack
            direction="row"
            gap={2}
            height="100%"
        >
            <LocalModListContextProvider>
                <TagsVisibilityContextProvider>
                    <ModList />
                    <Actions />
                    <ModInfo />
                </TagsVisibilityContextProvider>
            </LocalModListContextProvider>
        </Stack>
    )
}
