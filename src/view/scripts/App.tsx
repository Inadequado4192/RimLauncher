import { CssVarsProvider, Stack } from "@mui/joy";
import { TitleBar, Footer, } from "src/view/scripts/layouts";
import { LoadingFrame } from "src/view/scripts/layouts/LoadingFrame";
import ModuleTabs from "@Modules/ModuleTabs";
import { theme } from "@Context/Theme";
import { MainContextProvider } from "@Context/MainContext";
import { GameInfoContextProvider } from "@Context/GameInfoContext";
import { UserConfigContextProvider } from "@Context/UserConfigContext";
import { LocalContextProvider } from "@Context/LocalContext";
import { AlertContainer } from "@Services/Alert";
import { PromptContainer } from "@Services/Prompt";
import { ConfirmContainer } from "@Services/Confirm";
import { ReloadContextProvider } from "@Context/ReloadContext";
import { ModListContextProvider } from "@Context/ModListContext";
import { ModsConfigContextProvider } from "@Context/ModsConfig";
import { AlertBigContainer } from "@Services/AlertBig";

export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <ReloadContextProvider>
                <LocalContextProvider>
                    <MainContextProvider>
                        <GameInfoContextProvider>
                            <UserConfigContextProvider>
                                <ModsConfigContextProvider>
                                    <ModListContextProvider>
                                        <Stack>
                                            <TitleBar />
                                            <LoadingFrame>

                                                <ModuleTabs />
                                                <Footer />

                                                <AlertBigContainer />
                                                <AlertContainer />
                                                <PromptContainer />
                                                <ConfirmContainer />
                                            </LoadingFrame>
                                        </Stack>
                                    </ModListContextProvider>
                                </ModsConfigContextProvider>
                            </UserConfigContextProvider>
                        </GameInfoContextProvider>
                    </MainContextProvider>
                </LocalContextProvider>
            </ReloadContextProvider>
        </CssVarsProvider>
    )
}