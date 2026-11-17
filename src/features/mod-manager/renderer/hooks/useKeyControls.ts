import { ipc } from "#features/base/renderer";
import { useModsConfig } from "#features/mods-config/renderer";
import { ModsConfigIpc } from "#features/mods-config/shared";
import { useEffect, useRef } from "react";
import { PackageIdLower } from "#features/app/shared";
import { ModEntry } from "#features/mod-type/shared";
import { useModListView } from "../store";

type Action = "up" | "down" | "left" | "right" | "clear" | "toggle";

const KEYMAP: Record<string, Action> = {
    KeyW: "up", ArrowUp: "up",
    KeyS: "down", ArrowDown: "down",
    KeyA: "left", ArrowLeft: "left",
    KeyD: "right", ArrowRight: "right",
    Escape: "clear",
    Enter: "toggle", Space: "toggle",
};

const REPEAT_DELAY = 200;   // мс до початку автоповтору
const REPEAT_RATE = 35;     // мс між кроками

const isTyping = (t: EventTarget | null) =>
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

interface Props {
    enabled: ModEntry[];    // вже відфільтровані списки
    disabled: ModEntry[];
}

export function useKeyControls(props: Props) {
    // Списки в ref, щоб слухачі підписувалися один раз, а не при кожній зміні фільтра
    const latest = useRef(props);
    latest.current = props;

    useEffect(() => {
        let shift = false;
        let anchor: ModEntry | null = null;       // початок діапазону для Shift
        let heldCode: string | null = null;  // яка клавіша зараз затиснута
        let delayTimer: ReturnType<typeof setTimeout> | undefined;
        let repeatTimer: ReturnType<typeof setInterval> | undefined;

        function stopRepeat() {
            heldCode = null;
            clearTimeout(delayTimer);
            clearInterval(repeatTimer);
        }

        // Один крок руху
        function step(action: Action) {
            const { enabled, disabled } = latest.current;
            const state = useModListView.getState();
            const { cursor, selectedMods, selectMods } = state;

            if (action === "clear") {
                anchor = null;
                return selectMods([]);
            }
            if (action === "toggle") {
                return void toggleMods([...selectedMods]);
            }

            // У якому списку зараз курсор
            let side: "enabled" | "disabled" =
                cursor && enabled.includes(cursor) ? "enabled" : "disabled";
            const current = side === "enabled" ? enabled : disabled;
            let index = cursor ? current.indexOf(cursor) : -1;

            if (action === "left" || action === "right") {
                if (shift) return;                              // Shift працює лише в межах списку
                const target = action === "right" ? "enabled" : "disabled";
                if (target === side) return;
                side = target;
                index = Math.max(index, 0);
            } else {
                if (!current.length) return;
                const delta = action === "down" ? 1 : -1;
                index = index < 0
                    ? (delta > 0 ? 0 : current.length - 1)
                    : (index + delta + current.length) % current.length;
            }

            const list = side === "enabled" ? enabled : disabled;
            if (!list.length) return;
            index = Math.min(index, list.length - 1);
            const next = list[index]!;

            if (shift) {
                // anchor дійсний, лише якщо він досі вибраний і є в цьому списку
                if (!(anchor && selectedMods.has(anchor) && list.includes(anchor))) {
                    anchor = cursor && list.includes(cursor) ? cursor : next;
                }
                const a = list.indexOf(anchor);
                const range = list.slice(Math.min(a, index), Math.max(a, index) + 1);
                if (index < a) range.reverse();                 // next має бути останнім: це курсор
                selectMods(range);
            } else {
                anchor = null;
                selectMods([next]);
            }
        }

        function onKeyDown(ev: KeyboardEvent) {
            shift = ev.shiftKey;

            const action = KEYMAP[ev.code];
            if (!action || isTyping(ev.target)) return;
            ev.preventDefault();
            if (ev.repeat) return;                              // повтор ОС ігноруємо, робимо свій

            stopRepeat();
            step(action);                                       // перший крок одразу

            if (action === "up" || action === "down") {
                heldCode = ev.code;
                delayTimer = setTimeout(() => {
                    repeatTimer = setInterval(() => step(action), REPEAT_RATE);
                }, REPEAT_DELAY);
            }
        }

        function onKeyUp(ev: KeyboardEvent) {
            shift = ev.shiftKey;
            if (ev.code === heldCode) stopRepeat();
        }

        addEventListener("keydown", onKeyDown);
        addEventListener("keyup", onKeyUp);
        addEventListener("blur", stopRepeat);                   // втратили фокус: keyup не прийде

        return () => {
            removeEventListener("keydown", onKeyDown);
            removeEventListener("keyup", onKeyUp);
            removeEventListener("blur", stopRepeat);
            stopRepeat();
        };
    }, []);
}

export async function toggleMods(mods: ModEntry[]) {
    const active = new Set(
        (useModsConfig.getState().config?.activeMods ?? []).map((id) => id.toLowerCase())
    );

    const toEnable: PackageIdLower[] = [];
    const toDisable: PackageIdLower[] = [];
    for (const m of mods) {
        const id = m.about.packageId;
        (active.has(id.toLowerCase()) ? toDisable : toEnable).push(id);
    }

    // два виклики: кожен змінює конфіг один раз
    if (toEnable.length) await ipc.invoke(ModsConfigIpc.EnableMods, toEnable);
    if (toDisable.length) await ipc.invoke(ModsConfigIpc.DisableMods, toDisable);
}