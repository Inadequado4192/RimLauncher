import { Box, ButtonGroup, Divider, FormHelperText, IconButton, Input, Stack, Tooltip, Typography } from "@mui/joy";
import { SxProps } from "@mui/material";
import { Mod } from "../Classes/Mod";
import React from "react";
import * as colorsGroups from "@mui/material/colors";
import { getContrastColor } from "@Common/utils";
import Localize from "@Common/Localize";
import SaveIcon from '@mui/icons-material/Save';
import { UserConfigContext } from "@Context/UserConfigContext";


export default function ModTag({
    tag, onClick, disabled, sx, children
}: {
    sx?: SxProps,
    // slotProps?: {
    //     buttonGroup?: ButtonGroupProps,
    //     // label?: TypographyProps
    // }
    tag: Mod["tags"][number],

    // onCross?: () => void,
    onClick?: () => void,

    disabled?: boolean,

    // addVisibilitySwitcher?: boolean,

    children?: React.ReactNode | React.ReactNode[]
}) {
    const [isTooltipOpen, setTooltipOpen] = React.useState(false);
    // const { tagsV, setTagsV } = React.useContext(TagsVisibilityContext);

    return (
        <ButtonGroup
            sx={{
                ...ModTag.ButtonGroupSx({ tag, disabled }),
                ...sx as any,
            }}
        >
            <Tooltip
                arrow
                placement="bottom"
                open={isTooltipOpen}
                onClose={e => e.type != "blur" && setTooltipOpen(false)}
                title={<ModTagTooltip tag={tag} />}
                variant="outlined"
            >
                <IconButton
                    size="sm"
                    variant="outlined"
                    onClick={onClick}
                    onContextMenu={() => setTooltipOpen(true)}
                    sx={{ flex: 1 }}
                >
                    <Typography
                        level="body-xs"
                        sx={{
                            color: getContrastColor(tag.color),
                            opacity: .8,
                            maxWidth: 100,
                        }}
                        title={tag.name}
                        noWrap
                    >{tag.name}</Typography>
                </IconButton>
            </Tooltip>
            {children}
        </ButtonGroup >
    );
}


function ModTagTooltip({ tag }: { tag: ModTag }) {
    const { userConfig } = React.useContext(UserConfigContext)
    const [inputValue, setInputValue] = React.useState(tag.name);
    const isInputError = React.useMemo(() => userConfig?.tags.some(t => t !== tag && t.name === inputValue), [userConfig, inputValue]);

    function onSave() {
        if (isInputError) return;
        invoke.renameTag(tag.name, inputValue);
    }

    return (
        <Stack spacing={1}>
            <Input
                placeholder={Localize("tagName")}
                value={inputValue}
                endDecorator={
                    <IconButton
                        color={isInputError ? "danger" : "neutral"}
                        onClick={onSave}
                        disabled={isInputError}
                    >
                        <SaveIcon />
                    </IconButton>
                }
                onChange={e => setInputValue(e.currentTarget.value)}
                onKeyUp={(e) => { if (e.code == "Enter") onSave(); }}
                error={isInputError}
            />
            {isInputError && <FormHelperText sx={t => ({ color: t.palette.danger.softColor })}>{Localize("thisNameAlreadyUsed")}</FormHelperText>}

            <Divider>Color</Divider>
            <Stack direction="row">
                {Object.entries({ _base: { 0: "#000000", 100: "#ffffff" }, ...colorsGroups }).map(([name, colors]) =>
                    <Stack key={name}>{Object.entries(colors).map(([v, color]) => isNaN(+v) ? null :
                        <Box
                            key={v}
                            sx={{
                                background: color,
                                width: 20,
                                height: 20,
                                cursor: "pointer",
                                justifyContent: "center",
                                display: "flex",
                                "&:hover": { boxShadow: "inset 0 0 0px 1px rgba(0, 0, 0, 1)" }
                            }}
                            onClick={() => invoke.setTag({ ...tag, color })}
                        >{color == tag.color ? <Typography sx={{ color: getContrastColor(color) }}>X</Typography> : null}</Box>)}
                    </Stack>
                )}
            </Stack>
        </Stack>
    )
}


ModTag.ButtonGroupSx = ({ tag, disabled }: { tag: ModTag, disabled?: boolean }): SxProps => ({
    opacity: disabled ? .25 : void 0,
    pointerEvents: disabled ? "none" : void 0,

    "& > button.MuiIconButton-root:not(:hover)": {
        background: tag.color,
    },
    "& > button.MuiIconButton-root": {
        px: .5,
        py: .25,
        minHeight: 0,
        "&:hover *": { color: "white" }
    },
    "& > button.MuiIconButton-root > .MuiSvgIcon-root": {
        fontSize: 15,
        color: getContrastColor(tag.color),
        opacity: .8
    }
});


// ModTag.ModTagButtonGroup = function ({ tag, disabled, children, ...props }: {
//     tag: Mod["tags"][number],
//     disabled?: boolean,
// } & ButtonGroupProps) {
//     return (
//         <ButtonGroup
//             {...props}
//             sx={{
//                 ...ModTag.ButtonGroupSx({ tag, disabled }),
//                 ...props.sx as any
//             }}
//         >{children}</ButtonGroup>
//     )
// }