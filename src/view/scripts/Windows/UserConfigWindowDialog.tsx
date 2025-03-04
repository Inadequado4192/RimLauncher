import Localize from "@common/Localize";
import Schemes from "@common/Schemes";
import { ConfigContext } from "src/view/scripts/Context/ConfigContext";
import { LocalContext } from "src/view/scripts/Context/LocalContext";
import { Button, ButtonGroup, CircularProgress, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, FormLabel, Input, ModalDialog, Option, Radio, RadioGroup, RadioGroupProps, RadioProps, Select, Table, Typography, useColorScheme } from "@mui/joy";
import ModalClose from "@mui/joy/ModalClose";
import React from "react";
import { z } from "zod";

export default function UserConfigWindowDialog() {
    const { config } = React.useContext(ConfigContext);

    return !config ? <CircularProgress /> : (
        <ModalDialog minWidth="md">
            <DialogTitle>
                <ModalClose />
                {Localize("config")}
            </DialogTitle>
            <Section_Pathes />
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


function Section_Pathes() {
    const { config } = React.useContext(ConfigContext);
    const [errors, setErrors] = React.useState<z.ZodIssue[] | null>(null);

    React.useEffect(() => {
        invoke.UserConfigDebug().then(setErrors);
    }, [config]);


    function PathInput({ pkey, label }: { label: string, pkey: Extract<keyof UserConfig, "steamPath" | "gamePath"> }) {
        const [errorMessage, setErrorMessage] = React.useState("");
        
        React.useEffect(() => {
            const tError = errors?.find(e => e.path[0] == pkey);
            setErrorMessage(tError ? tError.message : "");
        }, [errors]);

        return (
            <FormControl error={!!errorMessage}>
                <FormLabel>{label}</FormLabel>
                <Input
                    value={config?.[pkey] ?? ""}
                    startDecorator={
                        <ButtonGroup>
                            <Button
                                onClick={() =>
                                    invoke.selectFile({ type: "folder" }).then(async p => {
                                        if (p.filePaths[0])
                                            invoke.setUserConfigByKey(pkey, p.filePaths[0]);
                                    })
                                }
                            >{Localize("change")}</Button>
                            <Button
                                onClick={() => config?.[pkey] && invoke.openPath(config[pkey])}
                            >{Localize("open")}</Button>
                        </ButtonGroup>
                    }
                />
                {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
            </FormControl>
        )
    }

    return (
        <>
            <Divider>
                <Typography>{Localize("config_sectionPathes")}</Typography>
            </Divider>
            <DialogContent>
                <PathInput pkey="steamPath" label={Localize("pathToSteam")} />
                <PathInput pkey="gamePath" label={Localize("pathToGame")} />
            </DialogContent>
        </>
    )
}

const _RadioProps: RadioProps = {
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
const _RadioGroupProps: RadioGroupProps = {
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
    return (
        <tr>
            <td><Typography>{Localize("closeWindowAfterRun")}</Typography></td>

            <td>
                <RadioGroup
                    {..._RadioGroupProps}
                    value={checked}
                    onChange={e => invoke.setUserConfigByKey("closeWindowAfterRun", e.currentTarget.value == "true")}
                >
                    <Radio {..._RadioProps} value={true} label={Localize("yes")} />
                    <Radio {..._RadioProps} value={false} label={Localize("no")} />
                </RadioGroup>
            </td>
        </tr>
    )
}
function ThemeChanger() {
    const coolotScheme = useColorScheme();

    const isDark = coolotScheme.mode == "dark";

    return (
        <tr>
            <td><Typography>{Localize("theme")}</Typography></td>
            <td>
                <RadioGroup
                    {..._RadioGroupProps}
                    value={coolotScheme.mode}
                    onChange={e => coolotScheme.setMode(isDark ? "light" : "dark")}
                >

                    <Radio {..._RadioProps} value="light" label={Localize("theme_light")} />
                    <Radio {..._RadioProps} value="dark" label={Localize("theme_dark")} />
                </RadioGroup>
            </td>
        </tr>
    )
}
function Language() {
    const { local, setLocal } = React.useContext(LocalContext);
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