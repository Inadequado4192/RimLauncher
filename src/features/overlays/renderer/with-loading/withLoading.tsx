import { createProgress } from "../progress";

export async function withLoading<T>(task: Promise<T> | (() => Promise<T>)): Promise<T> {
    const progress = createProgress();
    try {
        return await (typeof task === "function" ? task() : task);
    } finally {
        progress.close();
    }
}