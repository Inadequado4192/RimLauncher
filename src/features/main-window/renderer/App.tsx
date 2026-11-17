import { CssVarsProvider } from "@mui/joy";
import { Footer, LoadingFrame, ModuleTabs, TitleBar } from "./components";
import { OverlayHosts } from "#features/overlays/renderer";
import { theme } from "./Theme";

export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <TitleBar />
            <LoadingFrame>
                <ModuleTabs />
                <Footer />
            </LoadingFrame>

            <OverlayHosts />
        </CssVarsProvider>
    )
}
