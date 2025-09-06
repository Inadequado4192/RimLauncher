import Localize from "@Common/Localize";
import { UserConfigStore } from "@Stores";
import { Button, ButtonGroup, CircularProgress, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, FormLabel, Input, ModalDialog, Option, Radio, RadioGroup, RadioGroupProps, RadioProps, Select, Table, Typography, useColorScheme } from "@mui/joy";
import ModalClose from "@mui/joy/ModalClose";
import React from "react";
import { z } from "zod";
import { StoreCompareType } from "@Stores/store";

export default function UserConfigWindowDialog() {
    const userCloseWindowAfterRun = UserConfigStore.use(uc => uc.closeWindowAfterRun, StoreCompareType.Primitive);

    return (
        <ModalDialog minWidth="md">
            <DialogTitle>
                <ModalClose />
                {Localize("windows.config.label")}
            </DialogTitle>

            <Divider><Typography>{Localize("windows.config.sections.paths")}</Typography></Divider>
            <Section_Paths />

            <Divider />
            <DialogContent>
                <Table borderAxis="none" variant="plain" sx={{ width: "auto", alignSelf: "baseline" }}>
                    <tbody>
                        <CloseWindowAfterRun checked={!!userCloseWindowAfterRun} />
                        <ThemeChanger />
                        <Language />
                    </tbody>
                </Table>
            </DialogContent>
        </ModalDialog>
    )
}


function Section_Paths() {
    const userPathes: { [K in keyof UserConfig as K extends `${string}Path` ? K : never]: string | null } = {
        gamePath: UserConfigStore.use((uc) => uc.gamePath, StoreCompareType.Primitive),
        steamPath: UserConfigStore.use((uc) => uc.steamPath, StoreCompareType.Primitive),
    }
    const [errors, setErrors] = React.useState<z.ZodIssue[] | null>(null);

    React.useEffect(() => {
        $invoke.getUserConfigDebugPathes().then(setErrors);
    }, Object.values(userPathes));


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
                    value={userPathes[pkey] ?? ""}
                    startDecorator={
                        <ButtonGroup>
                            <Button
                                onClick={() =>
                                    $invoke.selectFile({ type: "folder" }).then(async p => {
                                        if (p.filePaths[0])
                                            $invoke.setUserConfigByKey(pkey, p.filePaths[0]);
                                    })
                                }
                            >{Localize("common.change")}</Button>
                            <Button
                                onClick={() => userPathes[pkey] && $invoke.openPath(userPathes[pkey])}
                            >{Localize("actions.open")}</Button>
                        </ButtonGroup>
                    }
                />
                {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
            </FormControl>
        )
    }

    return (
        <DialogContent sx={{ overflow: "hidden" }}>
            <PathInput pkey="steamPath" label={Localize("environment.paths.toSteam")} />
            <PathInput pkey="gamePath" label={Localize("environment.paths.toGame")} />
        </DialogContent>
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
            <td><Typography>{Localize("windows.config.closeWindowAfterRun")}</Typography></td>

            <td>
                <RadioGroup
                    {..._RadioGroupProps}
                    value={checked}
                    onChange={e => $invoke.setUserConfigByKey("closeWindowAfterRun", e.currentTarget.value == "true")}
                >
                    <Radio {..._RadioProps} value={true} label={Localize("common.yes")} />
                    <Radio {..._RadioProps} value={false} label={Localize("common.no")} />
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
            <td><Typography>{Localize("windows.config.theme.label")}</Typography></td>
            <td>
                <RadioGroup
                    {..._RadioGroupProps}
                    value={coolotScheme.mode}
                    onChange={e => coolotScheme.setMode(isDark ? "light" : "dark")}
                >

                    <Radio {..._RadioProps} value="light" label={Localize("windows.config.theme.light")} />
                    <Radio {..._RadioProps} value="dark" label={Localize("windows.config.theme.dark")} />
                </RadioGroup>
            </td>
        </tr>
    )
}
function Language() {
    const [local, setLocal] = React.useState<SomeLocal>();
    const [locals, setLocals] = React.useState<Awaited<ReturnType<typeof $invoke.getAccessLanguages>>>();

    React.useEffect(() => {
        $invoke.getTargetLocalJSON().then(setLocal);
        $invoke.getAccessLanguages().then(setLocals);
    }, []);

    return (
        <tr>
            <td><Typography>{Localize("windows.config.language")}</Typography></td>
            <td>
                <Select
                    value={locals?.find(l => l.data.name == local?.name)!.name ?? null}
                    onChange={async (e, v) => {
                        if (!v || !locals) return;
                        await $invoke.setLocal(v);
                        setLocal(locals.find(l => l.name == v)!.data);
                        location.reload();
                    }}
                >
                    {locals?.map(l => <Option key={l.name} value={l.name}>{l.data.name}</Option>)}
                </Select>
            </td>
        </tr>
    )
}