import { CssVarsProvider, Stack } from "@mui/joy";
import { TitleBar, Footer } from "src/view/scripts/Components/Parts";
import { theme } from "src/view/scripts/Context/Theme";
import { MainContextProvider } from "src/view/scripts/Context/MainContext";
import { GameInfoContextProvider } from "src/view/scripts/Context/GameInfoContext";
import { ConfigContextProvider } from "src/view/scripts/Context/ConfigContext";
import { LocalContextProvider } from "src/view/scripts/Context/LocalContext";
import { AlertContainer } from "src/view/scripts/Services/Alert";
import { PromptContainer } from "src/view/scripts/Services/Prompt";
import { ConfirmContainer } from "src/view/scripts/Services/Confirm";
import { MainBody } from "src/view/scripts/Modules/ModListManager";
import ModuleTabs from "@Modules/ModuleTabs";

export default function App() {
    return (
        <CssVarsProvider theme={theme} defaultMode="dark">
            <LocalContextProvider>
                <MainContextProvider>
                    <GameInfoContextProvider>
                        <ConfigContextProvider>
                            <Stack>
                                <TitleBar />
                                {/* <ModuleTabs /> */}
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