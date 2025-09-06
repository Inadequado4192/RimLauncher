import React from "react";
import { Accordion, AccordionDetails, AccordionGroup, AccordionSummary, Box, Button, CircularProgress, LinearProgress, Skeleton, Stack, Table, Typography } from "@mui/joy";
import Localize from "@Common/Localize";
import { openModChangesInSteam } from "../../utils";
import { AlertService } from "@Services/Alert";
import { UserConfigStore } from "@Stores";
import { StoreCompareType } from "@Stores/store";
import BaseModule from "../BaseModule";
import { __GlobalStores__ } from "@Renderer/scripts/Context/__GlobalStore__";
import useFetchWorkshopDetails from "./useFetchWorkshopDetails";

const Render = React.lazy(() => import("./render"));

export default class ModUpdates extends BaseModule {
    public constructor() {
        super({
            key: "ModUpdates",
        });
    }
    public override renderTitle(): ReturnType<BaseModule["renderTitle"]> {
        return Localize("tabs.modUpdates");
    }

    protected override _useBadge(): ReturnType<BaseModule["_useBadge"]> {
        const userLastCheckModUpdates = UserConfigStore.use(uc => uc.lastCheckModUpdates, StoreCompareType.Primitive);
        const [badgeContent, setBadgeContent] = React.useState(0);
        const data = useFetchWorkshopDetails();

        React.useEffect(() => {
            if (data?.[0]) {
                const time = new Date(userLastCheckModUpdates).getTime();
                setBadgeContent(data.filter(d => time < d.time_updated * 1000).length)
            }
        }, [userLastCheckModUpdates, data]);

        return { badgeContent }
    }

    public override render(): ReturnType<BaseModule["render"]> {
        return (
            <Render />
        )
    }
}