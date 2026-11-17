// overlays/renderer/tasks/TaskHost.tsx
import { memo } from "react";
import { Box, Card, IconButton, LinearProgress, Typography } from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { dismissTask, TaskState, useTasks } from "./taskStore";

const TaskCard = memo(function TaskCard({ task }: { task: TaskState }) {
    const { id, title, label, percent, details, status, error } = task;
    const color = status === "error" ? "danger" : status === "done" ? "success" : "primary";

    return (
        <Card variant="outlined" size="sm" sx={{
            minWidth: 300,
            maxWidth: "50%",
            gap: 0.5,
            boxShadow: "md",
            pointerEvents: "auto"
        }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {status === "done" && <CheckCircleIcon color="success" fontSize="small" />}
                {title && <Typography level="title-sm" noWrap sx={{ flex: 1 }}>{title}</Typography>}
                {status !== "running" && (
                    <IconButton size="sm" variant="plain" onClick={() => dismissTask(id)}><CloseIcon /></IconButton>
                )}
            </Box>

            {status === "error" ? (
                <Typography level="body-xs" color="danger">{error}</Typography>
            ) : (
                <Box>
                    {label && <Typography level="body-xs">{label}</Typography>}
                    <LinearProgress
                        color={color}
                        determinate={percent !== null}
                        value={percent ?? 0}
                        sx={{ my: 0.5 }}
                    />
                    {(percent !== null || details) && (
                        <Typography level="body-xs">
                            {[percent !== null ? `${percent}%` : null, details].filter(Boolean).join(" · ")}
                        </Typography>
                    )}
                </Box>
            )}
        </Card>
    );
});

export function TaskHost() {
    const tasks = useTasks((s) => s.tasks);
    if (!tasks.length) return null;

    return (
        <Box
            sx={{
                position: "fixed", right: 16, bottom: 16, zIndex: 1500,
                display: "flex", flexDirection: "column", gap: 1,
                pointerEvents: "none",
                alignItems: "flex-end"
            }}
        >
            {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
        </Box>
    );
}