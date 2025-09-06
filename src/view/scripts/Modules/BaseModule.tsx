import { Badge, ColorPaletteProp, Skeleton, Tab, TabPanel, TabProps } from "@mui/joy";
import React, { JSX } from "react";

export default abstract class BaseModule {
    public key: string;
    public constructor(params: {
        key: string
    }) {
        this.key = params.key;
    }

    public abstract renderTitle(): React.ReactNode;


    public tabRender = this._tabRender.bind(this);
    protected tabProps: Omit<TabProps, "value"> = {};
    protected _tabRender() {
        const b = this.useBadge();

        const t = <Tab value={this.key} {...this.tabProps}>{<this.renderTitle />}</Tab>

        if (b) {
            return (
                <Badge
                    badgeInset={10}
                    size="sm"
                    badgeContent={b.badgeContent}
                    slotProps={{
                        badge: { sx: { pointerEvents: "none" } }
                    }}
                    color={b.color}
                >{t}</Badge>
            )
        }
        return t;
    }

    public useBadge = this._useBadge.bind(this);
    protected _useBadge(): null | { badgeContent: number, color?: ColorPaletteProp } {
        return null;
    }

    public panelRender = this._panelRender.bind(this);
    protected _panelRender() {
        return (
            <TabPanel value={this.key}>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "auto"
                    }}
                >

                    <React.Suspense fallback={<Skeleton sx={{
                        "&::before": {
                            background: "var(--joy-palette-background-level1)"
                        }
                    }} />}>
                        <this.render />
                    </React.Suspense>
                </div>
            </TabPanel>
        )
    }

    public abstract render(): React.ReactNode | React.ReactNode[];
}

