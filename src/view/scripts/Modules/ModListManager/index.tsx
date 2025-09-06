import "./index.css";
import { Skeleton, Stack } from "@mui/joy";
import { __ModListStore__ } from "./__ModListStore__";
import BaseModule from "../BaseModule";
import Localize from "@Common/Localize";
import React from "react";

export default class ModListManager extends BaseModule {
    public constructor() {
        super({
            key: "ModListManager",
        });
    }
    
    public override renderTitle(): ReturnType<BaseModule["renderTitle"]> {
        return Localize("tabs.modListManager");
    }

    public override render(): ReturnType<BaseModule["render"]> {
        return (
            <Stack
                direction="row"
                gap={2}
                height="100%"
                sx={{
                    "& > :nth-of-type(1)": { flex: 2 }, // ModList
                    "& > :nth-of-type(2)": { flex: 1 }, // Actions
                    "& > :nth-of-type(3)": { flex: 2 }, // ModInfo
                }}
            >
                <__ModListStore__.Providers />
                <ModList />
                <Actions />
                <ModInfo />
            </Stack>
        )
    }
}

const ModList = React.lazy(() => import("./ModList"));
const Actions = React.lazy(() => import("./Actions"));
const ModInfo = React.lazy(() => import("./ModInfo"));