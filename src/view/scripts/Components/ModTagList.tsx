import { Stack } from "@mui/joy";
import ModTag from "./ModTag";
import { UserConfigStore } from "@Stores";
import { StoreCompareType } from "@Stores/store";

/**@deprecated */
export default function ModTagList({ tags, packageId }: { tags: ModTag[], packageId: PackageId }) {
    const userTags = UserConfigStore.use(uc => uc.tags, StoreCompareType.JSON);

    function onAdd(tag: ModTag) {
        $invoke.setTag({ ...tag, packageIds: [...tag.packageIds, packageId] });
    }

    function onRemove(tag: ModTag) {
        const cloneTag = { ...tag };
        cloneTag.packageIds = [...cloneTag.packageIds];

        const ind = cloneTag.packageIds.indexOf(packageId);
        if (ind >= 0) cloneTag.packageIds.splice(ind, 1);
        $invoke.setTag({ ...cloneTag });
    }

    return !!userTags.length && (
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
                            onClick={onRemove.bind({}, t)}
                        />
                    )}
                </Stack>
            )}
            <Stack>
                {userTags.map(t => {
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