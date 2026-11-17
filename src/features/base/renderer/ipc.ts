import { IpcEventMap, IpcInvokeMap, isResult, UnwrapResult } from "#features/base/shared";

interface IpcBridge {
    invoke<K extends keyof IpcInvokeMap>(
        channel: K, ...args: Parameters<IpcInvokeMap[K]>
    ): Promise<ReturnType<IpcInvokeMap[K]>>;

    on<K extends keyof IpcEventMap>(
        channel: K, cb: IpcEventMap[K]
    ): () => void;
}

declare global {
    interface Window { ipc: IpcBridge }
}
export class IpcResultError extends Error {
    constructor(public readonly error: unknown) { super("IPC result error"); }
}


export const ipc = {
    async invoke<K extends keyof IpcInvokeMap>(
        channel: K, ...args: Parameters<IpcInvokeMap[K]>
    ): Promise<UnwrapResult<Awaited<ReturnType<IpcInvokeMap[K]>>>> {
        const res = await window.ipc.invoke(channel, ...args);
        if (isResult(res)) {
            if (!res.success) throw res.error;//new IpcResultError(res.error);
            return res.data as any;
        }
        return res as any;
    },
    on: window.ipc.on,
};