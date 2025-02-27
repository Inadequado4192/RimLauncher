import { ConfigContext } from "@Context/ConfigContext";
import { LocalContext } from "@Context/LocalContext";
import { CircularProgress, DialogContent, DialogTitle, Divider, ModalDialog, Option, Radio, RadioGroup, RadioGroupProps, RadioProps, Select, Table, Typography, useColorScheme } from "@mui/joy";
import ModalClose from "@mui/joy/ModalClose";
import React from "react";

export default function UserConfigWindowDialog() {
    const { Localize } = React.useContext(LocalContext);
    const { config } = React.useContext(ConfigContext);

    return !config ? <CircularProgress /> : (
        <ModalDialog minWidth="md">
            <DialogTitle>
                <ModalClose />
                {Localize("config")}
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Table borderAxis="none" variant="plain" sx={{ width: "auto", alignSelf: "baseline" }}>
                    <tbody>
                        <CloseWindowAfterRun checked={!!config?.closeWindowAfterRun} />
                        <ThemeChanger />
                        <Language />
                    </tbody>
                </Table>
            </DialogContent>
        </ModalDialog>
    )
}


const RadioProps: RadioProps = {
    disableIcon: true,
    variant: "plain",
    sx: { px: 2, py: 1, alignItems: "center" },
    slotProps: {
        action: ({ checked }) => ({
            sx: {
                ...(checked && {
                    bgcolor: "background.surface",
                    boxShadow: "sm",
                    "&:hover": {
                        bgcolor: "background.surface",
                    },
                }),
            },
        }),
    }
}
const RadioGroupProps: RadioGroupProps = {
    orientation: "horizontal",
    sx: {
        display: "inline-flex",
        padding: "4px",
        borderRadius: "12px",
        bgcolor: "neutral.softBg",
        "--RadioGroup-gap": "8px",
        "--Radio-actionRadius": "8px",
    }
}

// function RunArg({ userConfig }: { userConfig: UserConfig }) {
//     const [value, setValue] = React.useState(userConfig.runArg);

//     return (
//         <Input
//             value={value}
//             onChange={e => setValue(e.currentTarget.value)}
//             onBlur={() => invoke.setUserConfigByKey("runArg", value)}
//         />
//     )
// }
function CloseWindowAfterRun({ checked }: { checked: boolean }) {
    const { Localize } = React.useContext(LocalContext);
    return (
        <tr>
            <td><Typography>{Localize("closeWindowAfterRun")}</Typography></td>

            <td>
                <RadioGroup
                    {...RadioGroupProps}
                    value={checked}
                    onChange={e => invoke.setUserConfigByKey("closeWindowAfterRun", e.currentTarget.value == "true")}
                >
                    <Radio {...RadioProps} value={true} label={Localize("yes")} />
                    <Radio {...RadioProps} value={false} label={Localize("no")} />
                </RadioGroup>
            </td>
        </tr>
    )
}
function ThemeChanger() {
    const { Localize } = React.useContext(LocalContext);
    const coolotScheme = useColorScheme();

    const isDark = coolotScheme.mode == "dark";

    return (
        <tr>
            <td><Typography>{Localize("theme")}</Typography></td>
            <td>
                <RadioGroup
                    {...RadioGroupProps}
                    value={coolotScheme.mode}
                    onChange={e => coolotScheme.setMode(isDark ? "light" : "dark")}
                >

                    <Radio {...RadioProps} value="light" label={Localize("theme_light")} />
                    <Radio {...RadioProps} value="dark" label={Localize("theme_dark")} />
                </RadioGroup>
            </td>
        </tr>
    )
}
function Language() {
    const { Localize, local, setLocal } = React.useContext(LocalContext);
    const [locals, setLocals] = React.useState<Awaited<ReturnType<typeof invoke.getAccessLanguages>>>();

    React.useEffect(() => {
        invoke.getAccessLanguages().then(setLocals);
    }, []);

    return (
        <tr>
            <td><Typography>{Localize("language")}</Typography></td>
            <td>
                <Select
                    value={locals?.find(l => l.data.name == local?.name)!.name ?? null}
                    onChange={async (e, v) => {
                        if (!v || !locals) return;
                        await invoke.setLocal(v);
                        setLocal(locals.find(l => l.name == v)!.data);
                    }}
                >
                    {locals?.map(l => <Option key={l.name} value={l.name}>{l.data.name}</Option>)}
                </Select>
            </td>
        </tr>
    )
}