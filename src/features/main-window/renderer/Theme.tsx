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
                size: "sm",
            },
            styleOverrides: {
                root: {
                    whiteSpace: "wrap"
                }
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
        },
        // JoyRadioGroup: {
        //     defaultProps: {
        //         orientation: "horizontal",
        //         sx: {
        //             display: "inline-flex",
        //             padding: "4px",
        //             borderRadius: "12px",
        //             bgcolor: "neutral.softBg",
        //             "--RadioGroup-gap": "4px",
        //             "--Radio-actionRadius": "8px",
        //             m: .5
        //         }
        //     }
        // },
        // JoyRadio: {
        //     defaultProps: {
        //         disableIcon: true,
        //         variant: "plain",
        //         sx: { px: 2, py:.5, alignItems: "center" },
        //         slotProps: {
        //             action: ({ checked }) => ({
        //                 sx: {
        //                     ...(checked && {
        //                         bgcolor: "background.surface",
        //                         boxShadow: "sm",
        //                         "&:hover": {
        //                             bgcolor: "background.surface",
        //                         },
        //                     }),
        //                 },
        //             }),
        //         }
        //     }
        // }
    },
});