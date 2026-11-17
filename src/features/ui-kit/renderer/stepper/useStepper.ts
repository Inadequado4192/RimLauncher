import { useCallback, useState } from "react";
import { UseStepperOptions, UseStepperReturn } from "./types";

function clampStep(step: number, totalSteps: number) {
    if (!Number.isFinite(step) || totalSteps === 0) return 0;
    return Math.min(Math.max(Math.trunc(step), 0), totalSteps - 1);
}

export function useStepper({
    steps,
    initialStep = 0,
    activeStep: controlledStep,
    onStepChange,
    canNavigateToStep,
}: UseStepperOptions): UseStepperReturn {
    const [internalStep, setInternalStep] = useState(() => clampStep(initialStep, steps.length));
    const activeStep = clampStep(controlledStep ?? internalStep, steps.length);
    const currentStep = steps[activeStep];

    const canGoToStep = useCallback((targetStep: number) => {
        if (!Number.isInteger(targetStep) || targetStep < 0 || targetStep >= steps.length) return false;
        if (steps[targetStep]?.disabled) return false;
        return canNavigateToStep?.(targetStep, activeStep) ?? true;
    }, [activeStep, canNavigateToStep, steps]);

    const goToStep = useCallback((targetStep: number) => {
        if (!canGoToStep(targetStep) || targetStep === activeStep) return;
        if (controlledStep === undefined) setInternalStep(targetStep);
        onStepChange?.(targetStep);
    }, [activeStep, canGoToStep, controlledStep, onStepChange]);

    const nextStep = useCallback(() => {
        for (let step = activeStep + 1; step < steps.length; step++) {
            if (!steps[step]?.disabled) {
                goToStep(step);
                return;
            }
        }
    }, [activeStep, goToStep, steps]);

    const prevStep = useCallback(() => {
        for (let step = activeStep - 1; step >= 0; step--) {
            if (!steps[step]?.disabled) {
                goToStep(step);
                return;
            }
        }
    }, [activeStep, goToStep, steps]);

    const reset = useCallback(() => {
        const step = clampStep(initialStep, steps.length);
        if (controlledStep === undefined) setInternalStep(step);
        if (step !== activeStep) onStepChange?.(step);
    }, [activeStep, controlledStep, initialStep, onStepChange, steps.length]);

    return {
        activeStep,
        currentStep,
        isFirstStep: activeStep === 0,
        isLastStep: steps.length > 0 && activeStep === steps.length - 1,
        goToStep,
        nextStep,
        prevStep,
        reset,
    };
}
