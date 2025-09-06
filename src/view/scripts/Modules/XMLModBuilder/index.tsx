import Localize from "@Common/Localize";
import BaseModule from "../BaseModule";
import { TabProps } from "@mui/joy";


export default class XMLModBuilder extends BaseModule {
    public constructor() {
        super({
            key: "XMLModBuilder",
        })
    }

    public override renderTitle(): ReturnType<BaseModule["renderTitle"]> {
        return Localize("tabs.xmlModBuilder");
    }
    protected override tabProps: BaseModule["tabProps"] = { disabled: true };
    public override render(): ReturnType<BaseModule["render"]> {
        return "Not Ready..."
    }
}