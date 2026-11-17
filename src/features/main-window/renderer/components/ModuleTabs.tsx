import { Tab, TabList, TabPanel, Tabs } from "@mui/joy";
import { ModManager } from "#features/mod-manager/renderer";
import { useLocalize } from "#features/localization/renderer";
// import ModListManager from "./ModListManager"
// import ModUpdates from "./ModUpdates"
// import React from "react";
// import XMLModBuilder from "./XMLModBuilder";
// import BaseModule from "./BaseModule";
// import { ContextStore, Store } from "../Stores/store";


// const Modules = [
//     new ModListManager(),
//     new ModUpdates(),
//     new XMLModBuilder(),
// ] as const satisfies BaseModule[];
export function ModuleTabs() {
    const t = useLocalize();

    return (
        <Tabs
            value="1"

            // defaultValue={Modules[0].key}
            sx={{
                backgroundColor: "transparent",
                flex: 1,
                overflow: "hidden",

                "& > .MuiTabPanel-root": {
                    p: 1,
                    flex: 1,
                    overflow: "auto",
                    height: "100%",
                    maxHeight: "100%",
                },
            }}
        >

            <TabList>
                <Tab value="1">{t("mainWindow.tabs.modListManager")}</Tab>
                <Tab value="2" disabled>{t("mainWindow.tabs.xmlModBuilder")}</Tab>
            </TabList>

            <TabPanel value="1">
                <ModManager />
            </TabPanel>
            {/* {Modules.map(M => <M.panelRender key={M.key} />)} */}
        </Tabs>
    )
}

// ModuleTabs.Store = new ContextStore({
//     selectedTab: new Store({ value: Modules[0].key })
// }, []);