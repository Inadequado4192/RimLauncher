import { TitleBar, Footer, } from "@Components/layouts";
import { LoadingFrame } from "@Components/layouts/LoadingFrame";
import ModuleTabs from "@Modules/ModuleTabs";
import { theme } from "@Context/Theme";
import { LocalContextProvider } from "@Context/LocalContext";
import { AlertContainer } from "@Services/Alert";
import { PromptContainer } from "@Services/Prompt";
import { ConfirmContainer } from "@Services/Confirm";
import { ModListContextProvider } from "@Context/ModListContext";
import { AlertBigContainer } from "@Services/AlertBig";
import { CssVarsProvider } from "@mui/joy";
import { LoadingContainer } from "@Services/LoadingService";


export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <div style={{ display: "flex", flexDirection: "column" }}>
                <TitleBar />
                <LoadingFrame>

                    <LocalContextProvider>
                        <ModListContextProvider>
                            <ModuleTabs />
                            <Footer />

                            <AlertBigContainer />
                            <AlertContainer />
                            <PromptContainer />
                            <ConfirmContainer />
                            <LoadingContainer />
                        </ModListContextProvider>
                    </LocalContextProvider>
                </LoadingFrame>
            </div>
        </CssVarsProvider>
    )
}