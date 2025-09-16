import { extendTheme } from "@mui/joy";

export const theme = extendTheme({
    radius: {
        xs: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
    },
    components: {
        JoyButtonGroup: {
            defaultProps: {
                size: "sm"
            },
        },
        JoyButton: {
            defaultProps: {
                color: "neutral",
                variant: "soft",
                tabIndex: -1,
                size: "sm"
            }
        },
        JoyIconButton: {
            defaultProps: {
                size: "sm"
            },
        },
        JoyListItemButton: {
            styleOverrides: {
                root: {
                    outline: "none !important"
                }
            }
        },
        JoyListItem: {
            styleOverrides: {
                root: {
                    outline: "none !important"
                }
            }
        }
    },
});