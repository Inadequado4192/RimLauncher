import { extendTheme } from "@mui/joy";

export const theme = extendTheme({
    components: {
        JoyButton: {
            defaultProps: {
                color: "neutral",
                variant: "soft",
                tabIndex: -1
            },
            // styleOverrides: {
            //     root: {
            //         borderRadius: 0
            //     }
            // }
        },
        JoyListItemButton: {
            styleOverrides: {
                root: {
                    outline: "none !important"
                }
            }
        }
    }
});