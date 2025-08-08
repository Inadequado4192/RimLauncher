import { ButtonGroup, IconButton, Typography } from "@mui/joy";
import { SxProps } from "@mui/material";
import { Mod } from "@Classes/Mod";
import { getContrastColor } from "@Common/utils";


/**@deprecated */
export default function ModTag({
    tag, onClick, disabled, sx
}: {
    sx?: SxProps,
    tag: DeepReadonly<ModTag>,

    onClick?: () => void,
    disabled?: boolean,
}) {
    // const { tagsV, setTagsV } = React.useContext(TagsVisibilityContext);

    return (
        <ButtonGroup
            sx={t => ({
                opacity: disabled ? .25 : void 0,
                pointerEvents: disabled ? "none" : void 0,

                "& > button.MuiIconButton-root": {
                    px: .5,
                    py: .25,
                    minHeight: 0,
                    background: tag.color,
                    "&:hover": {
                        background: t.palette.neutral[800],
                        "& *": { color: t.palette.common.white }
                    }
                },
                "& > button.MuiIconButton-root > .MuiSvgIcon-root": {
                    fontSize: 15,
                    color: getContrastColor(tag.color),
                    opacity: .8
                },
                ...sx as any,
            })}
        >
                <IconButton
                    size="sm"
                    variant="outlined"
                    onClick={onClick}
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
        </ButtonGroup>
    );
}

// ModTag.ButtonGroupSx = ({ t, tag, disabled }: { t: Theme, tag: ModTag, disabled?: boolean }): SxProps => ({
//     opacity: disabled ? .25 : void 0,
//     pointerEvents: disabled ? "none" : void 0,

//     "& > button.MuiIconButton-root": {
//         px: .5,
//         py: .25,
//         minHeight: 0,
//         "&:not(:hover)": { background: tag.color },
//         "&:hover *": { color: "white" }
//     },
//     "& > button.MuiIconButton-root > .MuiSvgIcon-root": {
//         fontSize: 15,
//         color: getContrastColor(tag.color),
//         opacity: .8
//     }
// });


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