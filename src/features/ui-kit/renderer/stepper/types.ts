import { ReactNode } from "react";

export interface StepperStep {
    id?: string;
    label: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    content?: ReactNode;
    disabled?: boolean;
    completed?: boolean;
    error?: boolean;
}

export interface UseStepperOptions {
    steps: readonly StepperStep[];
    initialStep?: number;
    activeStep?: number;
    onStepChange?: (step: number) => void;
    canNavigateToStep?: (targetStep: number, currentStep: number) => boolean;
}

export interface UseStepperReturn {
    activeStep: number;
    currentStep: StepperStep | undefined;
    isFirstStep: boolean;
    isLastStep: boolean;
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    reset: () => void;
}
