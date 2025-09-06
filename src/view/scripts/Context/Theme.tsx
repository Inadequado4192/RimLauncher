import { extendTheme } from "@mui/joy";

export const theme = extendTheme({
    radius: {
        lg: "0",
        md: "0",
        sm: "0",
        xl: "0",
        xs: "0",
    },
    components: {
        JoyButton: {
            defaultProps: {
                color: "neutral",
                variant: "soft",
                tabIndex: -1,
            }
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
        },
    }
});