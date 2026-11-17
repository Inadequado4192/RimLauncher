import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { Typography } from "@mui/joy";
import { TreeNodeBase, TreeProps } from "./types";
import { Tree } from "./Tree";

export interface FileEntry extends TreeNodeBase<FileEntry> {
    name: string;
    isDirectory: boolean;
    size?: number;
}

const byFolderThenName = (a: FileEntry, b: FileEntry) =>
    a.isDirectory === b.isDirectory
        ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        : a.isDirectory ? -1 : 1;

const formatSize = (n: number) =>
    n < 1024 ? `${n} B`
    : n < 1048576 ? `${(n / 1024).toFixed(1)} KB`
    : `${(n / 1048576).toFixed(1)} MB`;

const defaultLabel = (e: FileEntry) => e.name;

const defaultIcon = (e: FileEntry, open: boolean) =>
    e.isDirectory
        ? open ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />
        : <InsertDriveFileOutlinedIcon fontSize="small" />;

const defaultEnd = (e: FileEntry) =>
    !e.isDirectory && e.size !== undefined
        ? <Typography level="body-xs">{formatSize(e.size)}</Typography>
        : null;

type Defaulted = "getLabel" | "getIcon" | "sort" | "renderEnd";

type WithDefaults<P extends Partial<Record<Defaulted, unknown>>> = P extends unknown
    ? Omit<P, Defaulted> & Partial<Pick<P, Defaulted>>
    : never;

export type FileTreeProps = WithDefaults<TreeProps<FileEntry>>;

export function FileTree(props: FileTreeProps) {
    const { getLabel, getIcon, sort, renderEnd, ...rest } = props;

    return (
        <Tree<FileEntry>
            {...rest}
            getLabel={getLabel ?? defaultLabel}
            getIcon={getIcon ?? defaultIcon}
            sort={sort ?? byFolderThenName}
            renderEnd={renderEnd ?? defaultEnd}
        />
    );
}