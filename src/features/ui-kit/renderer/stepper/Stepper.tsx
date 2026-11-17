import { Box, Step, StepButton, Stepper as JoyStepper, Typography } from "@mui/joy";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { ComponentProps } from "react";
import { StepperStep } from "./types";

export type StepperProps = Omit<ComponentProps<typeof JoyStepper>, "children"> & {
    steps: readonly StepperStep[];
    activeStep: number;
    onStepClick?: (step: number) => void;
    showDescriptions?: boolean;
};

export function Stepper({
    steps,
    activeStep,
    onStepClick,
    showDescriptions = true,
    orientation = "horizontal",
    sx,
    ...joyProps
}: StepperProps) {
    const currentStep = Number.isFinite(activeStep)
        ? Math.min(Math.max(Math.trunc(activeStep), 0), Math.max(steps.length - 1, 0))
        : 0;

    return (
        <JoyStepper
            {...joyProps}
            orientation={orientation}
            sx={[
                {
                    width: "100%",
                    "--Step-gap": "0.5rem",
                    "--Step-connectorInset": "0.5rem",
                    "--Step-connectorThickness": "2px",
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {steps.map((step, index) => {
                const active = index === currentStep;
                const completed = step.completed ?? index < currentStep;
                const indicator = step.icon ?? (completed ? <CheckRoundedIcon /> : index + 1);
                const content = (
                    <Box sx={{ minWidth: 0, textAlign: "center" }}>
                        <Typography
                            level="title-sm"
                            sx={{
                                color: step.error
                                    ? "danger.500"
                                    : active
                                        ? "text.primary"
                                        : "text.tertiary",
                                fontWeight: active ? "lg" : "md",
                                lineHeight: 1.3,
                            }}
                        >
                            {step.label}
                        </Typography>
                        {showDescriptions && step.description && (
                            <Typography
                                level="body-xs"
                                sx={{ color: "text.tertiary", mt: 0.25, lineHeight: 1.35 }}
                            >
                                {step.description}
                            </Typography>
                        )}
                    </Box>
                );

                return (
                    <Step
                        key={step.id ?? index}
                        active={active}
                        completed={completed}
                        disabled={step.disabled}
                        orientation="vertical"
                        indicator={indicator}
                        slotProps={{
                            indicator: {
                                sx: {
                                    width: "2rem",
                                    height: "2rem",
                                    borderRadius: "50%",
                                    boxSizing: "border-box",
                                    border: "2px solid",
                                    borderColor: step.error
                                        ? "danger.500"
                                        : active
                                            ? "primary.500"
                                            : completed
                                                ? "success.500"
                                                : "neutral.300",
                                    bgcolor: step.error
                                        ? "danger.500"
                                        : active
                                            ? "primary.500"
                                            : completed
                                                ? "success.500"
                                                : "background.surface",
                                    color: step.error || active || completed
                                        ? "common.white"
                                        : "text.tertiary",
                                    fontSize: "sm",
                                    fontWeight: "lg",
                                    boxShadow: active ? "0 0 0 4px var(--joy-palette-primary-softBg)" : "none",
                                    transition: "all 160ms ease",
                                    ...(step.disabled && { opacity: 0.55 }),
                                },
                            },
                        }}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            alignItems: "center",
                            "--Step-connectorBg": completed
                                ? "var(--joy-palette-success-500)"
                                : "var(--joy-palette-divider)",
                            ...(step.disabled && { opacity: 0.55 }),
                        }}
                    >
                        {onStepClick ? (
                            <StepButton
                                disabled={step.disabled}
                                aria-current={active ? "step" : undefined}
                                onClick={() => onStepClick(index)}
                                sx={{
                                    width: "100%",
                                    minWidth: 0,
                                    minHeight: 2.25,
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: "sm",
                                    justifyContent: "center",
                                    transition: "color 150ms ease",
                                    "&:hover:not(:disabled)": { bgcolor: "transparent" },
                                    "&:focus-visible": {
                                        outline: "2px solid",
                                        outlineColor: "primary.500",
                                        outlineOffset: 2,
                                    },
                                    "&:hover:not(:disabled) .MuiTypography-title-sm": {
                                        color: "primary.500",
                                    },
                                }}
                            >
                                {content}
                            </StepButton>
                        ) : (
                            <Box sx={{ width: "100%", px: 0.5, py: 0.25 }}>{content}</Box>
                        )}
                    </Step>
                );
            })}
        </JoyStepper>
    );
}
