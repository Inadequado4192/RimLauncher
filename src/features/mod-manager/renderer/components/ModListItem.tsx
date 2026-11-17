import { ipc } from "#features/base/renderer";
import { ModsConfigIpc } from "#features/mods-config/shared";
import { hideTooltip, showTooltip } from "#features/overlays/renderer";
import { memo, useRef, useMemo, useCallback, MouseEvent, DragEvent } from "react";
import { ModIssue, IssueSeverity } from "#features/mod-core/renderer";
import { useModsConfig } from "#features/mods-config/renderer";
import { PackageIdLower } from "#features/app/shared";
import { disableMod, enableMod, getModIcon, getModSelfIcon } from "#features/mod-type/renderer";
import { useConfigSelector } from "#features/user-config/renderer";
import { ModTagsConfigField } from "#features/mod-tag/shared";
import { ModEntry } from "#features/mod-type/shared";
import { samePackageId } from "#features/mod-core/shared";
import { ModTooltip } from "./ModTooltip";
import { useModListView } from "../store";

const modListItemClass = "mod-list-item";

export const ModListItem = memo(function ModListItem({ mod, issue }: {
    mod: ModEntry,
    issue?: ModIssue[]
}) {
    const isSelected = useModListView(s => s.selectedMods.has(mod));

    const ref = useRef<HTMLLIElement>(null);
    const status = useMemo(() => {
        if (!issue) return "ok";
        return issue?.some(a => a.severity === IssueSeverity.Error) ? "error" : "warn";
    }, [issue]);

    //#region Events
    const onClick = useCallback((e: MouseEvent<HTMLElement>) => {
        if (e.ctrlKey) {
            useModListView.setState(({ selectedMods }) => {
                const next = new Set([...selectedMods]);

                if (next.has(mod)) next.delete(mod);
                else next.add(mod);

                return { selectedMods: next }
            });
        } else if (e.shiftKey) {
            // const list = mod.isActive() ? __ModListStores__.enabled.get() : __ModListStores__.disabled.get();
            // const firstMod = __ModListStores__.selectedMods.get()[0];
            // if (firstMod) __ModListStores__.selectedMods.set(Select.FromTo(list, firstMod, mod));
        } else {
            useModListView.getState().selectMods([mod]);
        }
    }, [mod]);
    const onMouseLeave = useCallback((_: MouseEvent<HTMLElement>) => {
        hideTooltip();
    }, []);
    const onContextMenu = useCallback(() => {
        if (!ref.current) return;
        showTooltip(ref.current, <ModTooltip mod={mod} issues={issue} />);
        // ModTooltip.Store.set({ mod, anchorEl: ref.current!, errorType });
    }, [mod, issue]);
    const onDoubleClick = useCallback((e: MouseEvent<HTMLElement>) => {
        if (e.ctrlKey || e.shiftKey) return;
        const active = useModsConfig.getState().config?.activeMods ?? [];
        const isActive = active.some(id => samePackageId(mod, id));
        if (isActive) disableMod(mod);
        else enableMod(mod);
    }, [mod]);
    const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
    }, []);
    const onDragStart = useCallback((e: DragEvent<HTMLElement>) => {
        e.dataTransfer.setData("packageId", mod.about.packageId);
    }, [mod]);
    const onDrop = useCallback((e: DragEvent<HTMLElement>) => {
        const targetId = e.dataTransfer.getData("packageId") as PackageIdLower || "";
        if (!targetId) return;

        const elem = e.currentTarget.closest(`.${modListItemClass}`);
        if (!elem) return;// $invoke.activeModAfter(targetId, mod.about.packageId);

        const rect = elem.getBoundingClientRect();

        if (e.pageY > rect.top + rect.height / 2)
            ipc.invoke(ModsConfigIpc.EnableModAfter, targetId, mod.about.packageId);
        else
            ipc.invoke(ModsConfigIpc.EnableModBefore, targetId, mod.about.packageId);
    }, [mod]);
    //#endregion


    const background = useConfigSelector(ModTagsConfigField, (tags) => {
        const colors = tags.filter((t) => t.packageIds.some((p) => samePackageId(mod, p))).map((t) => t.color);
        return colors.length
            ? `linear-gradient(90deg, transparent 50%, ${colors.join(", ")})`
            : null;
    });

    return (
        <li
            ref={ref}
            className={`list-item ${isSelected ? "selected" : ""} ${modListItemClass}`}
            data-mod-path={mod.dirPath}
            data-status={status}
            draggable
            onClick={onClick}
            onMouseLeave={onMouseLeave}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {background && <div className="background" style={{ background }} />}
            <ModIcon mod={mod} />
            <div className="label">{mod.about.name}</div>
        </li>
    )
});


const ModIcon = memo(function ModIcon({ mod }: { mod: ModEntry }) {
    const showModIcon = useModListView((s) => s.showModIcon);
    const TypeIcon = getModIcon(mod);

    return (
        <div className="icon" style={{ width: 18, height: 18, color: "inherit" }}>
            {showModIcon ? getModSelfIcon(mod) : <TypeIcon htmlColor="inherit" />}
        </div>
    );
});




