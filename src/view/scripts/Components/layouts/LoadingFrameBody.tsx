import Localize from "@Common/Localize";
import { Stack, Typography, Box, LinearProgress } from "@mui/joy";

export default function LoadingFrameBody() {
    return (
        <Stack
            alignItems="center"
            justifyContent="center"
            flex={1}
            gap={2}
        >
            <Box width={300}>
                <LinearProgress variant="soft" color="neutral" />
            </Box>
        </Stack>
    )
}