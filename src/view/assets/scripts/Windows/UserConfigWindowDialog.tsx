import Pathes from "@common/Pathes";
import Schemes from "@common/Schemes";
import { formatCamelCase } from "@common/utils";
import { ConfigContext } from "@Context/ConfigContext";
import { LocalContext } from "@Context/LocalContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CircularProgress, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, FormLabel, Input, Modal, ModalDialog, Option, Radio, RadioGroup, RadioGroupProps, RadioProps, Select, Table, Typography, useColorScheme } from "@mui/joy";
import ModalClose from "@mui/joy/ModalClose";
import React from "react";
import { useForm } from "react-hook-form";

export default function UserConfigWindowDialog() {
    const { Localize } = React.useContext(LocalContext);
    const { config, errors } = React.useContext(ConfigContext);

    const { register, formState, handleSubmit, ...form } = useForm<UserConfig>({
        resolver: zodResolver(Schemes.StoreDebug),
        defaultValues: config,
    });

    React.useEffect(() => void form.trigger(), [errors]);

    const onSave = handleSubmit(data => {
        invoke.setUserConfig(data);
        location.reload();
    }, console.warn);

    function PathConfig<P extends keyof UserConfig["pathes"]>({ pathName }: { pathName: P }) {
        const vpath = `pathes.${pathName}` as const;
        return (
            <FormControl error={!!formState.errors.pathes?.[pathName]}>
                <FormLabel>{Localize(`pathTo${formatCamelCase(pathName) as Capitalize<P>}`)}</FormLabel>
                <Input
                    {...register(vpath)}
                    startDecorator={
                        <>
                            <Button onClick={() =>
                                invoke.selectFile({ type: "folder" }).then(p => {
                                    if (p.filePaths[0])
                                        form.setValue(vpath, p.filePaths[0] as any, { shouldValidate: true })
                                })
                            }>{Localize("change")}</Button>
                            <Button onClick={() => invoke.openPath(form.getValues(vpath))}>{Localize("open")}</Button>
                        </>
                    }
                />
                {formState.errors.pathes?.[pathName] && <FormHelperText>{formState.errors.pathes?.[pathName].message}</FormHelperText>}
            </FormControl>
        )
    }

    const [pathes, setPathes] = React.useState<typeof Pathes>();
    React.useEffect(() => void invoke.getPathes().then(setPathes), []);

    return !config ? <CircularProgress /> : (
        <ModalDialog minWidth="md">
            <DialogTitle>
                <ModalClose />
                {Localize("config")}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ gap: 1 }}>
                <PathConfig pathName="steam" />
                <PathConfig pathName="game" />

                <FormControl>
                    <FormLabel>{Localize("openModsConfig")}</FormLabel>
                    <Input
                        startDecorator={<Button onClick={async () => pathes && invoke.openPath(pathes.ModsConfigXML)}>{Localize("open")}</Button>}
                        value={pathes?.ModsConfigXML ?? ""}
                        slotProps={{
                            input: { disabled: true, sx: { opacity: .5, overflow: "hidden" } }
                        }}
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>{Localize("argumentsForRunning")}</FormLabel>
                    <Input {...register("runArg")} placeholder={Localize("argumentsForRunning_placeholder")} />
                    <FormHelperText>{formState.errors.runArg?.message}</FormHelperText>
                </FormControl>
            </DialogContent>
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
            <Divider />
            <DialogActions>
                <Button onClick={onSave}>{Localize("save")}</Button>
            </DialogActions>
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
    const [locals, setLocals] = React.useState<SomeLocal[]>();

    React.useEffect(() => {
        invoke.getAccessLanguages().then(setLocals);
    }, []);

    return (
        <tr>
            <td><Typography>{Localize("language")}</Typography></td>
            <td>
                <Select
                    value={local?.name}
                    onChange={async (e, v) => {
                        if (!v || !locals) return;
                        await invoke.setLocal(v);
                        setLocal(locals.find(l => l.name == v)!);
                    }}
                >
                    {locals?.map(l => <Option key={l.name} value={l.name}>{l.localName}</Option>)}
                </Select>
            </td>
        </tr>
    )
}