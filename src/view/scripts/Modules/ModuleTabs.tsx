import { TabList, Tabs } from "@mui/joy"
import ModListManager from "./ModListManager"
import ModUpdates from "./ModUpdates"
import React from "react";
import XMLModBuilder from "./XMLModBuilder";
import BaseModule from "./BaseModule";
import { ContextStore, Store } from "../Stores/store";


const Modules = [
    new ModListManager(),
    new ModUpdates(),
    new XMLModBuilder(),
] as const satisfies BaseModule[];
export default function ModuleTabs() {

    return (
        <Tabs
            // value={Modules[0].key}
            
            defaultValue={Modules[0].key}
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
                {Modules.map(M => <M.tabRender key={M.key} />)}
            </TabList>

            {Modules.map(M => <M.panelRender key={M.key} />)}
        </Tabs>
    )
}

// ModuleTabs.Store = new ContextStore({
//     selectedTab: new Store({ value: Modules[0].key })
// }, []);