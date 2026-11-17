import { ModalDialog, DialogTitle, Divider, DialogContent, Table, DialogActions, Button, Typography, Stack, FormHelperText, Chip, ListItemButton, ModalClose } from "@mui/joy";
import DownloadIcon from "@mui/icons-material/Download";
import FolderIcon from "@mui/icons-material/Folder";
import LinkIcon from "@mui/icons-material/Link";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateIcon from "@mui/icons-material/Update";
import { useLocalize } from "#features/localization/renderer";
import { GitIpc, GitMod } from "../shared";
import { JSX, useEffect, useMemo, useState } from "react";
import { getRepoUrl } from "./gitUtils";
import { createPrompt, createDialog, createBackgroundTask, createConfirm } from "#features/overlays/renderer";
import z from "zod";
import { ipc } from "#features/base/renderer";
import { ArchiveEntry, InspectedArchive } from "#features/archive/shared";
import { FileEntry, FileTree, Stepper, useStepper, type StepperStep } from "#features/ui-kit/renderer";
import { SystemIpc } from "#features/system/shared";
import { useGitMods, useGitModsUpdates } from "./hooks";
import { samePackageId } from "#features/mod-core/shared";
import { PackageIdLower } from "#features/base/shared";


export function GitModsDialog({ onClose }: {
    onClose: () => void
}) {
    const t = useLocalize();
    const [selectedMod, setSelectedMod] = useState<GitMod>();
    const [updatingMods, setUpdatingMods] = useState<PackageIdLower[]>([]);
    const { hasUpdateSha } = useGitModsUpdates();

    const gitMods = useGitMods();

    useEffect(() => void (selectedMod && setSelectedMod(gitMods.find(m => samePackageId(m, selectedMod)))), [gitMods]);

    async function OnAdd() {
        const url = await createPrompt({
            title: "git url",
            validate: v => z.url().safeParse(v).success ? null : "bad url",
        });

        if (!url) return;

        const { installId } = await ipc.invoke(GitIpc.InstallStart, { url });

        startInstalation(installId);
    }

    async function OnUpdate() {
        if (!selectedMod || !selectedMod.data.gitInfo.ok) return;

        const { installId } = await ipc.invoke(GitIpc.InstallStart, { mod: selectedMod });

        setUpdatingMods(s => [...s, selectedMod.about.packageId]);

        startInstalation(installId, {
            onDone: () => {
                ipc.invoke(GitIpc.DeleteMod, selectedMod)
                setUpdatingMods(s => s.filter(id => id !== selectedMod.about.packageId));
            }
        });
    }

    return (
        <ModalDialog minWidth="md">
            <ModalClose onClick={onClose} />
            <DialogTitle>Git</DialogTitle>
            <Divider />
            <DialogContent>
                {hasUpdateSha.length > 0 && <Typography level="body-sm">Some mods highlighted in green may have updates available. Updates are detected by comparing the SHA of the latest installed commit with the SHA of the latest commit in the repository.</Typography>}
                <Table
                    variant="outlined"
                    sx={(t) => ({
                        background: t.palette.background.body,
                    })}
                >
                    <thead>
                        <tr>
                            <th style={{ width: 200 }}>{t("common.fields.name")}</th>
                            <th>{t("git.fields.brench")}</th>
                            <th>{t("git.fields.provider")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gitMods.map(m =>
                            <ItemRow
                                key={m.dirPath}
                                mod={m}
                                onClick={() => setSelectedMod(m)}
                                disabled={updatingMods.includes(m.about.packageId)}
                                selected={selectedMod === m}
                                hasUpdate={hasUpdateSha.some(sha => m.data.gitInfo.ok && m.data.gitInfo.data.state.installedVersionCommit === sha)}
                            />)}
                    </tbody>
                </Table>
            </DialogContent>
            <Divider />
            <DialogActions>
                <Button startDecorator={<DownloadIcon />} onClick={OnAdd}>{t("common.actions.add")}</Button>
                <Divider orientation="vertical" />
                <Button
                    startDecorator={<LinkIcon />}
                    disabled={!selectedMod || !selectedMod.data.gitInfo.ok}
                    onClick={() => selectedMod && selectedMod.data.gitInfo.ok && ipc.invoke(SystemIpc.OpenExternal, getRepoUrl(selectedMod.data.gitInfo.data))}
                >{t("git.openInGit")}</Button>
                <Button
                    color={selectedMod && selectedMod.data.gitInfo.ok && hasUpdateSha.includes(selectedMod.data.gitInfo.data.state.installedVersionCommit)
                        ? "success"
                        : "neutral"}
                    startDecorator={<UpdateIcon />}
                    disabled={!selectedMod || !selectedMod.data.gitInfo.ok}
                    onClick={OnUpdate}
                >{t("common.actions.update")}</Button>
                <Button
                    startDecorator={<FolderIcon />}
                    disabled={!selectedMod}
                    onClick={() => selectedMod && ipc.invoke(SystemIpc.OpenPath, selectedMod.dirPath)}
                >{t("common.actions.open")}</Button>
                <Button
                    startDecorator={<SettingsIcon />}
                    disabled={!selectedMod}
                    onClick={() => selectedMod && ipc.invoke(GitIpc.OpenModConfig, selectedMod)}
                >{t("common.actions.openConfig")}</Button>
                <Button
                    color="danger"
                    startDecorator={<DeleteIcon />}
                    disabled={!selectedMod}
                    onClick={async () => selectedMod && await createConfirm("common.confirm.delete") && ipc.invoke(GitIpc.DeleteMod, selectedMod)}
                >{t("common.actions.delete")}</Button>
            </DialogActions>
        </ModalDialog>
    )
}


function startInstalation(installId: string, opt?: {
    onDone?: () => void
}) {
    const task = createBackgroundTask({ title: `Installing...` });

    const u = ipc.on(GitIpc.InstallEvent, (e) => {
        if (e.installId !== installId) return;
        switch (e.type) {
            case "progress": task.update({ percent: e.percent, details: e.details }); break;
            case "inspected": showArchiveDialog(installId, e.archive); break;
            case "done":
                task.done("Installed");
                u();
                opt?.onDone?.();
                break;
            case "error":
                task.fail(String(e.error));
                u();
                break;
        }
    });
}
function showArchiveDialog(installId: string, archive: InspectedArchive) {
    createDialog((close) => <AddingDialogStepper
        inspectedArchive={archive}
        onFinish={async ({ excludeFiles, rootDirectory }) => {
            close();
            ipc.invoke(GitIpc.InstallConfirm, installId, { rootDirectory, excludeFiles: [...excludeFiles] });
        }}
    />, { dismissable: false });
}

function ItemRow({ mod, hasUpdate, ...props }: {
    mod: GitMod,
    disabled?: boolean,
    selected?: boolean
    onClick?: () => void,
    hasUpdate?: boolean
}) {
    const t = useLocalize();


    let body: JSX.Element;
    if (mod.data.gitInfo.ok) {
        const gitinfo = mod.data.gitInfo.data;
        body = (
            <>
                <td>{mod.about.name}</td>
                <td>{gitinfo.repo.ref}</td>
                <td>{gitinfo.repo.provider}</td>
            </>
        )
    } else {
        body = (
            <>
                <td>
                    <Typography color="danger">
                        {mod.about.name}
                    </Typography>
                </td>
                <td>
                    <Typography
                        color="danger"
                        whiteSpace="white-space"
                    >{t(mod.data.gitInfo.error.key, mod.data.gitInfo.error.args)}</Typography>
                </td>
            </>
        )
    }


    return (
        <ListItemButton
            selected={props.selected}
            onClick={props.onClick}
            disabled={props.disabled}
            color={hasUpdate ? "success" : "neutral"}
            component="tr"
            sx={{ display: "table-row" }}
        >{body}</ListItemButton>
    )
}





function AddingDialogStepper({
    inspectedArchive, onFinish
}: {
    inspectedArchive: InspectedArchive
    onFinish: (data: { excludeFiles: ReadonlySet<string>, rootDirectory: string }) => void
}) {
    const treeItems = useMemo(() => buildArchiveTree(inspectedArchive.entries), [inspectedArchive.entries]);
    const [rootDirectory, setRootDirectory] = useState<string | null>(inspectedArchive.suggestedRootDirectory);

    const relativeTreeItems = useMemo(() => {
        if (!rootDirectory) return treeItems;

        const findEntry = (entries: FileEntry[]): FileEntry | undefined => {
            for (const entry of entries) {
                if (entry.id === rootDirectory) return entry;

                const match = findEntry(entry.children ?? []);
                if (match) return match;
            }

        };

        return findEntry(treeItems)?.children ?? [];
    }, [treeItems, rootDirectory]);
    const [excludeFiles, setExcludeFiles] = useState<ReadonlySet<string>>(new Set([
        // Git
        ".git",
        ".github",
        ".gitignore",
        ".gitattributes",
        ".gitlab-ci.yml",

        // IDE
        ".vs/",
        ".vscode/",
        ".idea/",
        ".editorconfig/",

        // OS metadata
        "Thumbs.db",
        ".DS_Store",

        "Source/",
        "Tests/",
        "Test/", "test/",
        "Docs/", "docs/",
        "Documentation/",
        "ci/",
        "Deploy/"
    ].map(p => `${rootDirectory}${p}`)));


    const steps: StepperStep[] = useMemo(
        () => [
            {
                label: "Select Root directory",
                content: (
                    <Stack gap={2}>
                        <FormHelperText>
                            For the game to recognize the mod, it must be extracted correctly.
                            The program has already selected a folder that likely contains the mod files. Please check the directory tree below and select a different one if we made a mistake.
                        </FormHelperText>
                        <FileTree
                            nodes={treeItems}
                            selectionMode="single"
                            value={rootDirectory}
                            onChange={setRootDirectory}
                            isSelectable={(entry) => entry.isDirectory}
                        />
                        <Stack direction="row" gap={1}>
                            <Typography>Selected:</Typography>
                            <Chip>{rootDirectory}</Chip>
                        </Stack>
                    </Stack>
                )
            },
            {
                label: "Files to exclude",
                content: (
                    <Stack gap={2}>
                        <FormHelperText>
                            Select the files to be excluded from the archive. Or skip this step.
                        </FormHelperText>
                        <FileTree
                            nodes={relativeTreeItems}
                            selectionMode="multiple"
                            value={excludeFiles}
                            onChange={setExcludeFiles}
                        />
                    </Stack>
                )
            },
        ],
        [treeItems, rootDirectory, relativeTreeItems, excludeFiles]
    );


    const { activeStep, isFirstStep, isLastStep, nextStep, prevStep, goToStep } = useStepper({
        steps,
        canNavigateToStep: targetStep => targetStep !== 1 || !!rootDirectory,
    });

    return (
        <ModalDialog minWidth="md">
            <DialogContent>
                <Stack gap={3}>
                    <Stepper
                        steps={steps}
                        activeStep={activeStep}
                        onStepClick={goToStep}
                    />
                    {steps[activeStep]?.content}
                    <Stack direction="row" gap={1} justifyContent="flex-end">
                        <Button
                            variant="outlined"
                            color="neutral"
                            disabled={isFirstStep}
                            onClick={prevStep}
                        >
                            Back
                        </Button>
                        <Button
                            disabled={activeStep === 0 && !rootDirectory}
                            onClick={() => {
                                if (isLastStep) {
                                    if (rootDirectory) onFinish({ rootDirectory, excludeFiles });
                                } else {
                                    nextStep();
                                }
                            }}
                        >
                            {isLastStep ? "Finish" : "Next"}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </ModalDialog>
    )
}























export function buildArchiveTree(
    entries: ArchiveEntry[],
): FileEntry[] {
    interface MutableFileEntry extends FileEntry {
        childMap: Map<string, MutableFileEntry>;
    }

    const roots = new Map<string, MutableFileEntry>();

    for (const entry of entries) {
        const parts = entry.path.replace(/\\/g, "/").split("/").filter(Boolean);
        let currentMap = roots;
        let currentPath = "";

        for (let index = 0; index < parts.length; index++) {
            const name = parts[index]!;
            const isLast = index === parts.length - 1;
            const isDirectory = !isLast || entry.isDirectory;

            currentPath = currentPath ? `${currentPath}/${name}` : name;
            const id = isDirectory ? `${currentPath}/` : currentPath;
            let node = currentMap.get(name);

            if (!node) {
                node = {
                    id,
                    name,
                    isDirectory,
                    ...(isDirectory ? {} : { size: entry.size }),
                    children: [],
                    childMap: new Map(),
                };
                currentMap.set(name, node);
            } else if (isLast) {
                node.id = id;
                node.isDirectory = isDirectory;
                if (isDirectory) {
                    delete node.size;
                } else {
                    node.size = entry.size;
                }
            }

            currentMap = node.childMap;
        }
    }

    function toFileEntries(nodes: Map<string, MutableFileEntry>): FileEntry[] {
        return [...nodes.values()]
            .map(({ childMap, ...node }) => ({
                ...node,
                children: toFileEntries(childMap),
            }))
            .sort((a, b) => {
                if (a.isDirectory !== b.isDirectory) {
                    return a.isDirectory ? -1 : 1;
                }

                return a.name.localeCompare(b.name);
            });
    }

    return toFileEntries(roots);
}