import { Button, Divider, FormHelperText, IconButton, Input, Stack, Tooltip, Typography } from "@mui/joy";
//#region Icons
import SaveIcon from "@mui/icons-material/Save";
//#endregion
import { getContrastColor } from "@Common/utils";
import Tag from "../Classes/Tag";
import React from "react";
import Localize from "@Common/Localize";
import { HexColorPicker } from "react-colorful";
import { UserConfigStore } from "../Stores";
import { ConfirmService } from "../Services/Confirm";
import { SxProps } from "@mui/material";


const ModTag = React.memo(function ModTag({
    tag, onClick, disabled, sx
}: {
    tag: Tag,
    onClick?: () => void,
    disabled?: boolean,
    sx?: SxProps
}) {
    const [isTooltipOpen, setTooltipOpen] = React.useState(false);

    return (
        <Tooltip
            arrow
            placement="bottom"
            open={isTooltipOpen}
            onClose={e => e.type != "blur" && setTooltipOpen(false)}
            title={<TagTooltip tag={tag} />}
            variant="outlined"
        >
            <Button
                size="sm"
                variant="outlined"
                onClick={onClick}
                onContextMenu={() => setTooltipOpen(true)}
                sx={t => ({
                    opacity: disabled ? .25 : void 0,
                    pointerEvents: disabled ? "none" : void 0,
                    // flex: 1,
                    px: .5,
                    py: .25,
                    minHeight: 0,
                    minWidth: 50,
                    background: tag.color,
                    "&:hover": {
                        background: t.palette.neutral[800],
                        "& *": { color: t.palette.common.white }
                    },
                    ...sx as any,
                })}
            >
                <Typography
                    level="body-xs"
                    sx={{
                        color: getContrastColor(tag.color),
                        fontSize: "10px"
                    }}
                    title={tag.name}
                    maxWidth={100}
                    noWrap
                >{tag.name}</Typography>
            </Button>
        </Tooltip>
    );
});

export default ModTag;


function TagTooltip({ tag }: { tag: Tag }) {
    const NameBlock = React.useCallback(function NameBlock({ tagName, defaultName }: { defaultName: string, tagName: string }) {
        const [name, setName] = React.useState(defaultName);
        const isInputError = React.useMemo(() => {
            const userTags = UserConfigStore.get().tags;
            return userTags.some(t => t.name === name && t.name !== defaultName);
        }, [name]);

        function onSave() {
            if (isInputError) return;
            $invoke.updateTag(tagName, "name", name);
        }


        return (
            <>
                <Input
                    placeholder={Localize("common.name")}
                    value={name}
                    endDecorator={
                        <IconButton
                            color={isInputError ? "danger" : "neutral"}
                            onClick={onSave}
                            disabled={isInputError}
                        >
                            <SaveIcon />
                        </IconButton>
                    }
                    onChange={e => setName(e.currentTarget.value)}
                    onKeyUp={(e) => { if (e.code == "Enter") onSave(); }}
                    error={isInputError}
                    sx={{ width: 200 }}
                />
                {isInputError && <FormHelperText sx={t => ({ color: t.palette.danger.softColor })}>{Localize("common.validation.thisNameAlreadyUsed")}</FormHelperText>}

            </>
        )
    }, []);
    const ColorBlock = React.useCallback(function ColorBlock({ tagName, defaultColor }: { defaultColor: string, tagName: string }) {
        const [color, setColor] = React.useState(defaultColor);
        return (
            <>
                <Divider>{Localize("common.color")}</Divider>
                <HexColorPicker
                    color={color}
                    onChange={setColor}
                    onMouseUp={() => $invoke.updateTag(tagName, "color", color)}
                />
            </>
        )
    }, []);
    const DeleteButton = React.useCallback(function DeleteButton({ tagName }: { tagName: string }) {
        async function onRemove(tagname: string) {
            if (await ConfirmService.create({ message: Localize("confirm.deletionTag") }).endPromise)
                $invoke.removeTag(tagname);
        }
        return <Button color="danger" onClick={onRemove.bind({}, tagName)}>{Localize("actions.delete")}</Button>
    }, []);

    return (
        <Stack spacing={1}>
            <NameBlock tagName={tag.name} defaultName={tag.name} />
            <ColorBlock tagName={tag.name} defaultColor={tag.color} />
            <DeleteButton tagName={tag.name} />
        </Stack>
    )
}

// TagTooltip.store = new Store