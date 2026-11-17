import { useCallback } from "react";
import { ButtonGroup, IconButton } from "@mui/joy";
import { useModListView } from "../store";

export function ListActions() {
    const SplitSearch = useCallback(function SplitSearch() {
        const e = useModListView(s => s.splitSearch);
        const { toggleSplitSearch } = useModListView.getState();
        return (
            <IconButton
                variant={e ? "solid" : "soft"}
                onClick={() => toggleSplitSearch()}
                title="Split search"
            >S</IconButton>
        )
    }, []);

    const ShowModIcon = useCallback(function ShowModIcon() {
        const e = useModListView(s => s.showModIcon);
        const { toggleModIcon } = useModListView.getState();

        return (
            <IconButton
                variant={e ? "solid" : "soft"}
                onClick={() => toggleModIcon()}
                title="Show mod icon"
            >I</IconButton>
        )
    }, []);

    return (
        <ButtonGroup variant="outlined">
            <SplitSearch />
            <ShowModIcon />
        </ButtonGroup>
    )
}
