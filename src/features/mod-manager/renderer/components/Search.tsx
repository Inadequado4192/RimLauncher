import { IconButton, Input, Stack } from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";
import { useLocalize } from "#features/localization/renderer";
import { useModListView } from "../store";


export function Search() {
    const t = useLocalize();
    const split = useModListView((s) => s.splitSearch);
    const searchD = useModListView((s) => s.searchD);
    const searchE = useModListView((s) => s.searchE);

    const { setBoth, setSearchD, setSearchE } = useModListView.getState();

    if (!split) {
        return (
            <Input
                placeholder={t("common.actions.search")}
                value={searchD}
                onChange={e => setBoth(e.currentTarget.value)}
                endDecorator={
                    <IconButton
                        onClick={() => setBoth("")}
                        sx={{ borderRadius: "50%" }}
                    ><CloseIcon /></IconButton>
                }
            />
        );
    } else {
        return (
            <Stack direction="row" spacing={1}>
                <Input
                    placeholder={t("common.actions.search")}
                    value={searchD}
                    sx={{ width: 0, flex: 1 }}
                    onChange={e => setSearchD(e.currentTarget.value)}
                    endDecorator={
                        <IconButton
                            onClick={() => setSearchD("")}
                            sx={{ borderRadius: "50%" }}
                        ><CloseIcon /></IconButton>
                    }
                    fullWidth
                />
                <Input
                    placeholder={t("common.actions.search")}
                    value={searchE}
                    sx={{ width: 0, flex: 1}}
                    onChange={e => setSearchE(e.currentTarget.value)}
                    endDecorator={
                        <IconButton
                            onClick={() => setSearchE("")}
                            sx={{ borderRadius: "50%" }}
                        ><CloseIcon /></IconButton>
                    }
                    fullWidth
                />
            </Stack>
        )
    }
}