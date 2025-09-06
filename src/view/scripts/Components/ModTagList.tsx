import { Stack } from "@mui/joy";
import ModTag from "./ModTag";
import Tag from "../Classes/Tag";
import { Mod } from "../Classes/Mod";
import { __ModListStores__ } from "../Modules/ModListManager/__ModListStore__";

export default function ModTagList({ mod }: { mod: Mod }) {
    const allTags = __ModListStores__.tags.use();
    const modTags = mod.store.use(m => m.tags);

    function onAdd(tag: Tag) {
        $invoke.updateTag(tag.name, "packageIds", [...tag.packageIds, mod.about.packageId])
    }

    function onRemove(tag: Tag) {
        $invoke.updateTag(tag.name, "packageIds", tag.packageIds.filter(pid => pid !== mod.about.packageId));
    }

    return !!allTags.length && (
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
            {!!modTags.length && (
                <Stack>
                    {modTags.map((t, i) =>
                        <ModTag
                            key={i}
                            tag={t}
                            onClick={onRemove.bind({}, t)}
                        />
                    )}
                </Stack>
            )}
            <Stack
                sx={{
                    opacity: .5
                }}
            >
                {allTags.map(t => {
                    if (modTags.some(mt => mt.name == t.name)) return null;
                    return (
                        <ModTag
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