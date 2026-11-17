import { Popper } from "@mui/base/Popper";
import { Sheet } from "@mui/joy";
import { cancelHideTooltip, hideTooltip, useTooltip } from "./tooltipStore";

export function TooltipHost() {
    const state = useTooltip((s) => s.state);
    if (!state) return null;

    return (
        <Popper
            open
            anchorEl={state.anchorEl}
            placement="right-start"
            style={{ zIndex: 2000 }}
            modifiers={[
                {
                    name: "arrow",
                    enabled: true,
                },
                {
                    name: "preventOverflow",
                    enabled: true,
                    options: {
                        altAxis: true,
                        tether: true,
                        rootBoundary: "viewport",
                        padding: 8,
                    },
                },
                {
                    name: "flip",
                    enabled: true,
                    options: {
                        fallbackPlacements: ["left-start"],
                        rootBoundary: "viewport",
                        padding: 8,
                    },
                },
            ]}
        >
            <Sheet
                variant="outlined"
                sx={{ p: 1, boxShadow: "md" }}
                onMouseEnter={cancelHideTooltip}
                onMouseLeave={() => hideTooltip()}
            >
                {state.content}
            </Sheet>
        </Popper>
    );
}