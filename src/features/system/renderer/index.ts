import { ipc } from "#features/base/renderer";
import { SystemIpc } from "../shared";

export const openUrl = (url: string) => ipc.invoke(SystemIpc.OpenExternal, url);