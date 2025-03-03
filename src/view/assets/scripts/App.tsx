import { CssVarsProvider, Stack } from "@mui/joy";
import { TitleBar, Footer } from "@Parts";
import { theme } from "@Context/Theme";
import { MainContextProvider } from "@Context/MainContext";
import { GameInfoContextProvider } from "@Context/GameInfoContext";
import { ConfigContextProvider } from "@Context/ConfigContext";
import { LocalContextProvider } from "@Context/LocalContext";
import { AlertContainer } from "@Services/Alert";
import { PromptContainer } from "@Services/Prompt";
import { ConfirmContainer } from "@Services/Confirm";
import { MainBody } from "@Modules/ModListManager";

export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <LocalContextProvider>
                <MainContextProvider>
                    <GameInfoContextProvider>
                        <ConfigContextProvider>
                            <Stack>
                                <TitleBar />
                                <MainBody />
                                <Footer />


                                <AlertContainer />
                                <PromptContainer />
                                <ConfirmContainer />
                            </Stack>
                        </ConfigContextProvider>
                    </GameInfoContextProvider>
                </MainContextProvider>
            </LocalContextProvider>
        </CssVarsProvider>
    )
}