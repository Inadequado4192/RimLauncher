import { extendTheme } from "@mui/joy";

export const theme = extendTheme({
    components: {
        JoyButton: {
            defaultProps: {
                color: "neutral",
                variant: "soft"
            },
            // styleOverrides: {
            //     root: {
            //         borderRadius: 0
            //     }
            // }
        }
    }
});