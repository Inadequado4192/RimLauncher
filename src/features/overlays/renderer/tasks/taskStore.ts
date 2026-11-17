import { create } from "zustand";


export interface TaskStateOptions {
    title?: string;
    label?: string;
}
export interface TaskState {
    id: string;
    title: string | null;
    label: string | null;
    percent: number | null;
    details: string | null;
    status: "running" | "done" | "error";
    error: string | null;
}

export const useTasks = create<{ tasks: TaskState[] }>()(() => ({ tasks: [] }));

export interface BackgroundTask {
    update(patch: Partial<Pick<TaskState, "label" | "percent" | "details" | "title">>): void;
    done(label?: string): void;
    fail(message: string): void;
    error(error: unknown): void;
    dismiss(): void;
}

const AUTO_HIDE_MS = 3000;

export function createBackgroundTask(opts: TaskStateOptions): BackgroundTask {
    const id = crypto.randomUUID();
    const patch = (p: Partial<TaskState>) =>
        useTasks.setState((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
    const dismiss = () =>
        useTasks.setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));

    useTasks.setState((s) => ({
        tasks: [...s.tasks, {
            id,
            title: opts.title ?? null,
            label: opts.label ?? null,
            percent: null,
            details: null,
            status: "running",
            error: null
        }],
    }));

    return {
        update: (p) => patch(p),
        done: (label) => {
            patch({ status: "done", percent: 100, ...(label ? { label } : {}) });
            setTimeout(dismiss, AUTO_HIDE_MS);
        },
        fail: (message) => patch({ status: "error", error: message }),
        error: (error) => patch({ status: "error", error: String(error) }),
        dismiss,
    };
}
createBackgroundTask.error = (title: string, error: unknown) => createBackgroundTask({ title }).error(error);

export const dismissTask = (id: string) =>
    useTasks.setState((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));