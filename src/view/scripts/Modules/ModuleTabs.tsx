import { Badge, Box, Tab, TabList, TabPanel, Tabs } from "@mui/joy"
import Localize from "@Common/Localize"
import ModListManager from "./ModListManager"
import ModUpdates from "./ModUpdates"

export default function ModuleTabs() {
    const ModUpdates_useNofify = ModUpdates.useNotify();

    return (
        <Tabs
            defaultValue={0}
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
                // "& > .MuiTabPanel-root > *": {
                //     height: "100%",
                //     maxHeight: "100%",
                //     overflow: "auto",
                // }
            }}
        >
            <TabList>
                <Tab value={0}>{Localize("tab_ModListManager")}</Tab>
                <Badge badgeInset={6} invisible={!ModUpdates_useNofify}>
                    <Tab value={1}>{Localize("tab_ModUpdates")}</Tab>
                </Badge>
            </TabList>
            <TabPanel value={0}>
                <ModListManager />
            </TabPanel>
            <TabPanel value={1}>
                <ModUpdates />
            </TabPanel>
        </Tabs >
    )
}