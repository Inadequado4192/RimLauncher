import { TitleBar, Footer, } from "@Components/layouts";
import { LoadingFrame } from "@Components/layouts/LoadingFrame";
import ModuleTabs from "@Modules/ModuleTabs";
import { theme } from "@Context/Theme";
import { LocalContextProvider } from "@Context/LocalContext";
import { ModListContextProvider } from "@Context/ModListContext";
import { CssVarsProvider } from "@mui/joy";
import { createService } from "./Services/BaseService";


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

                            {<createService.Containers />}
                        </ModListContextProvider>
                    </LocalContextProvider>
                </LoadingFrame>
            </div>
        </CssVarsProvider>
    )
}