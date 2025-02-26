import { extendTheme } from "@mui/joy";

export const theme = extendTheme({
    colorSchemes: {
        dark: {
            palette: {
                focusVisible: "rgba(255, 0, 0, .5)"
            }
        }
    },
    components: {
        JoyButton: {
            defaultProps: {
                color: "neutral",
                variant: "soft"
            },
            styleOverrides: {
                root: {
                    borderRadius: 0
                }
            }
        }
    }
});