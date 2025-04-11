import { UserConfigContext } from "@Context/UserConfigContext";
import { Stack, Tooltip, Chip, IconButton } from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import ModTag from "./ModTag";

export default function ModTagList({ tags, packageId }: { tags: ModTag[], packageId: PackageId }) {
    const { userConfig: config } = React.useContext(UserConfigContext);

    function onAdd(tag: ModTag) {
        invoke.setTag({ ...tag, packageIds: [...tag.packageIds, packageId] });
    }

    function onRemove(tag: ModTag) {
        const ind = tag.packageIds.indexOf(packageId);
        if (ind >= 0) tag.packageIds.splice(ind, 1);
        invoke.setTag({ ...tag });
    }

    return !!config?.tags.length && (
        <Stack
            direction="column"
            flexWrap="wrap"
            useFlexGap
            spacing={1}
            sx={{
                "& > .MuiStack-root": {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 1
                }
            }}
        >
            {!!tags.length && (
                <Stack>
                    {tags.map((t, i) =>
                        <ModTag
                            key={i}
                            tag={t}
                        >
                            <IconButton
                                size="sm"
                                variant="outlined"
                                onClick={onRemove.bind({}, t)}
                            >
                                <CloseIcon />
                            </IconButton>
                        </ModTag>
                    )}
                </Stack>
            )}
            <Stack>
                {config.tags.map(t => {
                    if (tags.some(mt => mt.name == t.name)) return null
                    return (
                        <ModTag
                            sx={{ opacity: .5 }}
                            key={t.name}
                            onClick={onAdd.bind({}, t)}
                            tag={t}
                        />
                    );
                })}
            </Stack>
        </Stack>
    )
}