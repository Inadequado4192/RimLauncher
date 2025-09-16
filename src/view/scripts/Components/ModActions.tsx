import { SvgIconProps, IconButton, ButtonGroup } from "@mui/joy";
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import SteamIcon from "@Renderer/scripts/Components/Icons/SteamIcon";
import GithubIcon from "@Renderer/scripts/Components/Icons/GithubIcon";
import LinkIcon from '@mui/icons-material/Link';
import { ModType } from "enums";
import React from "react";
import { Mod } from "../Classes/Mod";
import { ConfirmService } from "../Services/Confirm";
import { Store } from "../Stores/store";
import { ModsConfigStore } from "../Stores";

export function ModActions({ mod: original }: { mod: Mod }) {
    const storeRef = React.useRef(new Store<Mod>({ value: original }));
    const store = storeRef.current;

    React.useEffect(() => storeRef.current.set(original), [original]);



    const Layout = React.useCallback(React.memo(() => {
        const ToggleButton = React.useCallback(function ToggleButton() {
            const [isActive, setIsActive] = React.useState(store.get().isActive());
            
            React.useEffect(() => {
                function callback() {
                    const mod = store.get();
                    setIsActive(mod.isActive())
                }

                const subs = [
                    store.subscribe(callback),
                    ModsConfigStore.subscribe(callback)
                ]

                return () => subs.forEach(c => c());
            }, []);

            return (
                <IconButton color={isActive ? "success" : "neutral"} onClick={() => store.get().toggleState()}>
                    <PowerSettingsNewIcon />
                </IconButton>
            )
        }, []);
        const DeleteButton = React.useCallback(function DeleteButton() {
            const display = store.use(mod => [ModType.Local, ModType.Git].includes(mod?.type!));
            if (!display) return null;

            return (
                <IconButton
                    color="danger"
                    onClick={async () => {
                        const mod = store.get();
                        if (mod.isLocal() && await ConfirmService.create({}).endPromise) mod.delete();
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            );
        }, []);
        const UnsubscribeButton = React.useCallback(function UnsubscribeButton() {
            const display = store.use(mod => [ModType.Steam].includes(mod?.type!));

            if (!display) return null;

            return (
                <IconButton
                    color="danger"
                    onClick={async () => {
                        const mod = store.get();
                        if (mod.isSteam()) mod.unsubscribe();
                    }}
                    disabled
                >
                    <DeleteIcon />
                </IconButton>
            );
        }, []);


        const OpenDirButton = React.useCallback(function OpenDirButton() {
            return <IconButton color="primary" onClick={() => store.get().openDir()}><FolderIcon /></IconButton>
        }, []);
        const OpenInSteamButton = React.useCallback(function OpenInSteamButton() {
            const display = store.use(mod => mod.isSteam());
            if (!display) return null;

            return (
                <IconButton
                    color="primary"
                    onClick={() => {
                        const mod = store.get();
                        if (mod.isSteam()) mod.openInSteam();
                    }}
                >
                    <SteamIcon />
                </IconButton>
            )
        }, []);
        const OpenInGitButton = React.useCallback(function OpenInGitButton() {
            const display = store.use(mod => mod.isGit());
            if (!display) return null;

            return (
                <IconButton
                    color="primary"
                    onClick={() => {
                        const mod = store.get();
                        if (mod.isGit()) mod.openInGit();
                    }}
                >
                    <GithubIcon />
                </IconButton>
            )
        }, []);
        const OpenSourceButton = React.useCallback(function OpenSourceButton() {
            const display = store.use(mod => mod.hasSourceUrl());
            if (!display) return null;
            return (
                <IconButton
                    color="primary"
                    onClick={() => {
                        const mod = store.get();
                        if (mod.hasSourceUrl()) mod.openSource();
                    }}
                >
                    <LinkIcon />
                </IconButton>
            )
        }, []);


        return (
            <ButtonGroup size="sm" variant="plain">
                <ToggleButton />
                <DeleteButton />
                <UnsubscribeButton />
                <OpenDirButton />
                <OpenInSteamButton />
                <OpenInGitButton />
                <OpenSourceButton />
            </ButtonGroup>
        )
    }), [])

    return <Layout />
}
