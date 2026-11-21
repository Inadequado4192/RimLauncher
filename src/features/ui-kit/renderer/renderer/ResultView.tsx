import type { ReactNode } from "react";
import { LinearProgress, Typography } from "@mui/joy";
import { Result } from "#features/base/shared";

interface ResultViewProps<T, E> {
    result: Result<T, E> | undefined;
    children: (data: T) => ReactNode;
    loading?: ReactNode;
    renderError?: (error: E) => ReactNode;
}

export function ResultView<T, E>({ result, children, loading, renderError }: ResultViewProps<T, E>) {
    if (!result) return <>{loading ?? <LinearProgress />}</>;
    if (!result.success) {
        return <>{renderError ? renderError(result.error) : <Typography color="danger">{String(result.error)}</Typography>}</>;
    }
    return <>{children(result.data)}</>;
}